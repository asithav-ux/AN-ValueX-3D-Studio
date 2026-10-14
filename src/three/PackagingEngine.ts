import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import type {
  ArtworkMapping,
  BackgroundSettings,
  BoxDimensions,
  CameraPreset,
  CameraSettings,
  LabelDimensions,
  LightingSettings,
  MaterialSettings,
  PackagingCategory,
  PackagingModelType,
  PouchDimensions,
} from '../types/packaging';
import { generateBumpMapCanvas, renderProcessedTextureCanvas } from '../utils/artwork';

export class PackagingEngine {
  public canvas: HTMLCanvasElement;
  public renderer: THREE.WebGLRenderer;
  public scene: THREE.Scene;
  public camera: THREE.PerspectiveCamera | THREE.OrthographicCamera;
  public controls: OrbitControls;

  private activeCameraType: 'perspective' | 'orthographic' = 'perspective';
  private persCamera: THREE.PerspectiveCamera;
  private orthoCamera: THREE.OrthographicCamera;

  // Environment & Lights
  private pmremGenerator: THREE.PMREMGenerator;
  private envTexture: THREE.Texture | null = null;
  private keyLight: THREE.DirectionalLight;
  private fillLight: THREE.DirectionalLight;
  private rimLight: THREE.DirectionalLight;
  private ambientLight: THREE.AmbientLight;

  // Studio Ground & Shadows
  private groundGroup: THREE.Group;
  private contactShadowMesh: THREE.Mesh | null = null;
  private floorReflectionMesh: THREE.Mesh | null = null;

  // Model hierarchy
  public modelGroup: THREE.Group;
  private activeMeshes: THREE.Object3D[] = [];
  private allocatedTextures: THREE.Texture[] = [];
  private allocatedMaterials: THREE.Material[] = [];
  private allocatedGeometries: THREE.BufferGeometry[] = [];

  // Animation & Turntable
  private animationFrameId: number | null = null;
  public isTurntableActive = false;
  public turntableSpeed = 0.5; // rad/s approx
  private targetCameraPos = new THREE.Vector3(0, 8, 32);
  private targetLookAt = new THREE.Vector3(0, 7, 0);
  private isCameraTransitioning = false;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;

    // 1. Renderer initialization with ACESFilmicToneMapping & sRGB color pipeline
    const isHeadless = navigator.webdriver || /HeadlessChrome/i.test(navigator.userAgent);
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      alpha: true,
      preserveDrawingBuffer: true,
      powerPreference: 'high-performance',
    });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.1;
    this.renderer.setPixelRatio(isHeadless ? 1 : Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.shadowMap.enabled = !isHeadless;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // 2. Scene
    this.scene = new THREE.Scene();

    // 3. Studio Environment Map (RoomEnvironment PMREM)
    this.pmremGenerator = new THREE.PMREMGenerator(this.renderer);
    this.pmremGenerator.compileEquirectangularShader();
    const roomEnv = new RoomEnvironment();
    this.envTexture = this.pmremGenerator.fromScene(roomEnv, 0.04).texture;
    this.scene.environment = this.envTexture;
    roomEnv.dispose();

    // 4. Cameras
    const aspect = canvas.clientWidth / (canvas.clientHeight || 1);
    this.persCamera = new THREE.PerspectiveCamera(40, aspect, 0.1, 1000);
    this.persCamera.position.set(0, 10, 36);

    const frustumSize = 30;
    this.orthoCamera = new THREE.OrthographicCamera(
      (-frustumSize * aspect) / 2,
      (frustumSize * aspect) / 2,
      frustumSize / 2,
      -frustumSize / 2,
      0.1,
      1000
    );
    this.orthoCamera.position.set(0, 10, 36);

    this.camera = this.persCamera;

    // 5. Controls
    this.controls = new OrbitControls(this.camera, this.canvas);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.minDistance = 6;
    this.controls.maxDistance = 120;
    this.controls.maxPolarAngle = Math.PI / 2 + 0.05;
    this.controls.target.set(0, 7, 0);

    // 6. Studio Lighting Rig
    this.keyLight = new THREE.DirectionalLight(0xfff8ee, 2.2);
    this.keyLight.position.set(15, 25, 20);
    this.keyLight.castShadow = true;
    this.keyLight.shadow.mapSize.width = 2048;
    this.keyLight.shadow.mapSize.height = 2048;
    this.keyLight.shadow.camera.near = 0.5;
    this.keyLight.shadow.camera.far = 80;
    const d = 20;
    this.keyLight.shadow.camera.left = -d;
    this.keyLight.shadow.camera.right = d;
    this.keyLight.shadow.camera.top = d;
    this.keyLight.shadow.camera.bottom = -d;
    this.keyLight.shadow.bias = -0.0005;
    this.keyLight.shadow.normalBias = 0.02;
    this.scene.add(this.keyLight);

    this.fillLight = new THREE.DirectionalLight(0xeef4ff, 1.2);
    this.fillLight.position.set(-20, 15, -15);
    this.scene.add(this.fillLight);

    this.rimLight = new THREE.DirectionalLight(0xffffff, 1.5);
    this.rimLight.position.set(0, 20, -25);
    this.scene.add(this.rimLight);

    this.ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    this.scene.add(this.ambientLight);

    // 7. Ground & Contact Shadow
    this.groundGroup = new THREE.Group();
    this.scene.add(this.groundGroup);
    this.setupContactShadow();

    // 8. Packaging Model Root Group
    this.modelGroup = new THREE.Group();
    this.scene.add(this.modelGroup);

    // 9. Resize & Render Loop
    this.handleResize = this.handleResize.bind(this);
    window.addEventListener('resize', this.handleResize);
    this.handleResize();
    this.startRenderLoop();
  }

  private setupContactShadow() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      const grad = ctx.createRadialGradient(256, 256, 10, 256, 256, 240);
      grad.addColorStop(0, 'rgba(0, 0, 0, 0.65)');
      grad.addColorStop(0.3, 'rgba(0, 0, 0, 0.35)');
      grad.addColorStop(0.7, 'rgba(0, 0, 0, 0.1)');
      grad.addColorStop(1, 'rgba(0, 0, 0, 0.0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 512, 512);
    }

    const shadowTex = new THREE.CanvasTexture(canvas);
    this.allocatedTextures.push(shadowTex);

    const shadowGeo = new THREE.PlaneGeometry(35, 35);
    const shadowMat = new THREE.MeshBasicMaterial({
      map: shadowTex,
      transparent: true,
      opacity: 0.7,
      depthWrite: false,
    });
    this.contactShadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
    this.contactShadowMesh.rotation.x = -Math.PI / 2;
    this.contactShadowMesh.position.y = 0.005;
    this.contactShadowMesh.renderOrder = 0;
    this.groundGroup.add(this.contactShadowMesh);

    const floorGeo = new THREE.PlaneGeometry(200, 200);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x111111,
      roughness: 0.15,
      metalness: 0.05,
      depthWrite: true,
    });
    this.floorReflectionMesh = new THREE.Mesh(floorGeo, floorMat);
    this.floorReflectionMesh.rotation.x = -Math.PI / 2;
    this.floorReflectionMesh.position.y = 0;
    this.floorReflectionMesh.receiveShadow = true;
    this.groundGroup.add(this.floorReflectionMesh);
  }

  public handleResize() {
    if (!this.canvas) return;
    const width = this.canvas.clientWidth || 800;
    const height = this.canvas.clientHeight || 600;

    this.renderer.setSize(width, height, false);

    const aspect = width / height;
    this.persCamera.aspect = aspect;
    this.persCamera.updateProjectionMatrix();

    const frustumSize = 28;
    this.orthoCamera.left = (-frustumSize * aspect) / 2;
    this.orthoCamera.right = (frustumSize * aspect) / 2;
    this.orthoCamera.top = frustumSize / 2;
    this.orthoCamera.bottom = -frustumSize / 2;
    this.orthoCamera.updateProjectionMatrix();
  }

  public setCameraType(type: 'perspective' | 'orthographic') {
    if (this.activeCameraType === type) return;
    this.activeCameraType = type;

    const currentPos = this.camera.position.clone();
    const currentTarget = this.controls.target.clone();

    if (type === 'orthographic') {
      this.orthoCamera.position.copy(currentPos);
      this.camera = this.orthoCamera;
    } else {
      this.persCamera.position.copy(currentPos);
      this.camera = this.persCamera;
    }

    this.controls.object = this.camera;
    this.controls.target.copy(currentTarget);
    this.controls.update();
  }

  public setCameraPreset(preset: CameraPreset, animate = true) {
    const target = this.controls.target.clone();
    const radius = 34;
    let pos = new THREE.Vector3();

    switch (preset) {
      case 'front':
        pos.set(target.x, target.y + 1, target.z + radius);
        break;
      case 'back':
        pos.set(target.x, target.y + 1, target.z - radius);
        break;
      case 'left':
        pos.set(target.x - radius, target.y + 1, target.z);
        break;
      case 'right':
        pos.set(target.x + radius, target.y + 1, target.z);
        break;
      case 'top':
        pos.set(target.x, target.y + radius * 1.1, target.z + 0.01);
        break;
      case 'bottom':
        pos.set(target.x, target.y - radius * 1.1, target.z + 0.01);
        break;
      case 'three-quarter':
      default:
        pos.set(target.x + radius * 0.7, target.y + radius * 0.45, target.z + radius * 0.7);
        break;
    }

    if (!animate) {
      this.camera.position.copy(pos);
      this.controls.update();
      return;
    }

    this.targetCameraPos.copy(pos);
    this.isCameraTransitioning = true;
  }

  public resetCamera() {
    this.setCameraPreset('three-quarter', true);
  }

  public zoomIn() {
    const dir = new THREE.Vector3();
    this.camera.getWorldDirection(dir);
    this.camera.position.addScaledVector(dir, 4);
    this.controls.update();
  }

  public zoomOut() {
    const dir = new THREE.Vector3();
    this.camera.getWorldDirection(dir);
    this.camera.position.addScaledVector(dir, -4);
    this.controls.update();
  }

  // -------------------------------------------------------------
  // MODEL REBUILDING
  // -------------------------------------------------------------
  public rebuildPackagingModel(
    category: PackagingCategory,
    modelType: PackagingModelType,
    boxDims: BoxDimensions,
    labelDims: LabelDimensions,
    pouchDims: PouchDimensions,
    artworks: Record<string, ArtworkMapping>,
    materialSettings: MaterialSettings
  ) {
    this.disposeCurrentModel();

    if (category === 'box') {
      this.buildBoxModel(modelType, boxDims, artworks, materialSettings);
    } else if (category === 'label') {
      this.buildLabelModel(modelType, labelDims, artworks, materialSettings);
    } else if (category === 'pouch') {
      this.buildPouchModel(modelType, pouchDims, artworks, materialSettings);
    }

    const bbox = new THREE.Box3().setFromObject(this.modelGroup);
    const size = new THREE.Vector3();
    bbox.getSize(size);
    const maxDimension = Math.max(size.x, size.z, 5);

    if (this.contactShadowMesh) {
      this.contactShadowMesh.scale.set(maxDimension * 0.35, maxDimension * 0.35, 1);
    }

    const center = new THREE.Vector3();
    bbox.getCenter(center);
    this.controls.target.set(0, Math.max(1, center.y), 0);
    this.controls.update();
  }

  private disposeCurrentModel() {
    while (this.modelGroup.children.length > 0) {
      const obj = this.modelGroup.children[0];
      this.modelGroup.remove(obj);
    }

    for (const geo of this.allocatedGeometries) geo.dispose();
    for (const mat of this.allocatedMaterials) mat.dispose();
    for (const tex of this.allocatedTextures) tex.dispose();

    this.allocatedGeometries = [];
    this.allocatedMaterials = [];
    this.allocatedTextures = [];
    this.activeMeshes = [];
  }

  // -------------------------------------------------------------
  // BOX MODEL BUILDER
  // -------------------------------------------------------------
  private buildBoxModel(
    modelType: PackagingModelType,
    dims: BoxDimensions,
    artworks: Record<string, ArtworkMapping>,
    matSettings: MaterialSettings
  ) {
    const W = dims.width || 8;
    const H = dims.height || 14;
    const D = dims.depth || 5;

    const panelOrder = ['right', 'left', 'top', 'bottom', 'front', 'back'];
    const materials: THREE.Material[] = panelOrder.map((panelId) => {
      const artwork = artworks[panelId] || {
        panelId,
        dataUrl: '',
        fileName: '',
        fileSize: 0,
        naturalWidth: 1024,
        naturalHeight: 1024,
        aspectRatio: 1,
        fit: 'fit',
        scale: 1,
        offsetX: 0,
        offsetY: 0,
        rotation: 0,
        foilColor: 'none',
        foilThreshold: 0.5,
        embossDepth: 0,
        spotVarnish: false,
        opacity: 1,
      };
      return this.createPackagingMaterial(artwork, matSettings);
    });

    if (modelType === 'cylinder-tube') {
      const radius = W / 2;
      const cylGeo = new THREE.CylinderGeometry(radius, radius, H, 64, 1, false);
      this.allocatedGeometries.push(cylGeo);

      const sideMat = this.createPackagingMaterial(artworks['front'] || artworks['wraparoundLabel'] || artworks['right'], matSettings);
      const topMat = this.createPackagingMaterial(artworks['top'], matSettings);
      const botMat = this.createPackagingMaterial(artworks['bottom'], matSettings);

      const tubeMesh = new THREE.Mesh(cylGeo, [sideMat, topMat, botMat]);
      tubeMesh.position.y = H / 2;
      tubeMesh.castShadow = true;
      tubeMesh.receiveShadow = true;
      this.modelGroup.add(tubeMesh);
      this.activeMeshes.push(tubeMesh);
      return;
    }

    if (modelType === 'sleeve-box' || modelType === 'drawer-box') {
      // Outer sleeve + inner sliding tray
      const sleeveGeo = new THREE.BoxGeometry(W + 0.15, H + 0.15, D + 0.15);
      this.allocatedGeometries.push(sleeveGeo);
      const sleeveMesh = new THREE.Mesh(sleeveGeo, materials);
      sleeveMesh.position.y = H / 2;
      sleeveMesh.castShadow = true;
      this.modelGroup.add(sleeveMesh);

      // Inner tray slightly pulled out
      const trayOffset = modelType === 'drawer-box' ? (dims.trayOffset || 2.2) : 1.2;
      const trayGeo = new THREE.BoxGeometry(W * 0.96, H * 0.94, D * 0.96);
      this.allocatedGeometries.push(trayGeo);
      const trayMat = new THREE.MeshStandardMaterial({
        color: 0x222222,
        roughness: 0.8,
        metalness: 0.05,
      });
      this.allocatedMaterials.push(trayMat);
      const trayMesh = new THREE.Mesh(trayGeo, trayMat);
      trayMesh.position.set(0, H / 2, trayOffset);
      trayMesh.castShadow = true;
      this.modelGroup.add(trayMesh);

      // Ribbon pull tab for drawer box
      if (modelType === 'drawer-box') {
        const ribbonGeo = new THREE.BoxGeometry(1.2, 0.05, 0.6);
        this.allocatedGeometries.push(ribbonGeo);
        const ribbonMat = new THREE.MeshStandardMaterial({ color: 0xd4af37, roughness: 0.4 });
        this.allocatedMaterials.push(ribbonMat);
        const ribbonMesh = new THREE.Mesh(ribbonGeo, ribbonMat);
        ribbonMesh.position.set(0, H / 2, trayOffset + (D * 0.48) + 0.3);
        this.modelGroup.add(ribbonMesh);
      }

      this.activeMeshes.push(sleeveMesh, trayMesh);
      return;
    }

    if (modelType === 'rigid-gift-box' || modelType === 'lid-and-base') {
      const lidH = dims.lidHeight || H * 0.35;
      const baseH = H - lidH * 0.85;

      const baseGeo = new THREE.BoxGeometry(W, baseH, D);
      this.allocatedGeometries.push(baseGeo);
      const baseMesh = new THREE.Mesh(baseGeo, materials);
      baseMesh.position.y = baseH / 2;
      baseMesh.castShadow = true;
      baseMesh.receiveShadow = true;
      this.modelGroup.add(baseMesh);

      const lidW = W + 0.16;
      const lidD = D + 0.16;
      const lidGeo = new THREE.BoxGeometry(lidW, lidH, lidD);
      this.allocatedGeometries.push(lidGeo);

      const lidMaterials = materials.map((m) => m.clone());
      lidMaterials.forEach((m) => this.allocatedMaterials.push(m));

      const lidMesh = new THREE.Mesh(lidGeo, lidMaterials);
      lidMesh.position.y = H - lidH / 2;
      lidMesh.castShadow = true;
      lidMesh.receiveShadow = true;
      this.modelGroup.add(lidMesh);
      this.activeMeshes.push(baseMesh, lidMesh);
      return;
    }

    // Standard folding carton / tuck-end / reverse tuck-end / auto-bottom
    const boxGeo = new THREE.BoxGeometry(W, H, D, 2, 2, 2);
    this.allocatedGeometries.push(boxGeo);

    const boxMesh = new THREE.Mesh(boxGeo, materials);
    boxMesh.position.y = H / 2;
    boxMesh.castShadow = true;
    boxMesh.receiveShadow = true;
    this.modelGroup.add(boxMesh);
    this.activeMeshes.push(boxMesh);

    // Crease edge bevel highlight lines
    const edges = new THREE.EdgesGeometry(boxGeo, 30);
    this.allocatedGeometries.push(edges);
    const edgeMat = new THREE.LineBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: 0.1,
      linewidth: 1,
    });
    this.allocatedMaterials.push(edgeMat);
    const edgeLines = new THREE.LineSegments(edges, edgeMat);
    edgeLines.position.y = H / 2;
    this.modelGroup.add(edgeLines);
  }

  // -------------------------------------------------------------
  // CONTAINER & BOTTLE BUILDER
  // -------------------------------------------------------------
  private buildLabelModel(
    modelType: PackagingModelType,
    dims: LabelDimensions,
    artworks: Record<string, ArtworkMapping>,
    matSettings: MaterialSettings
  ) {
    const R = (dims.diameter || 6.5) / 2;
    const totalH = dims.height || 18;
    const capH = dims.capHeight || 3.0;
    const neckH = dims.neckHeight || 2.5;
    const bodyH = totalH - capH - neckH;

    const bodyMat = this.createContainerBodyMaterial(matSettings);
    this.allocatedMaterials.push(bodyMat);

    const capMat = this.createCapMaterial(matSettings);
    this.allocatedMaterials.push(capMat);

    if (modelType === 'metal-tin') {
      const tinGeo = new THREE.CylinderGeometry(R, R, bodyH + neckH, 64);
      this.allocatedGeometries.push(tinGeo);
      const tinMesh = new THREE.Mesh(tinGeo, bodyMat);
      tinMesh.position.y = (bodyH + neckH) / 2;
      tinMesh.castShadow = true;
      tinMesh.receiveShadow = true;
      this.modelGroup.add(tinMesh);
      this.activeMeshes.push(tinMesh);

      const lidR = R + 0.08;
      const lidGeo = new THREE.CylinderGeometry(lidR, lidR, capH, 64);
      this.allocatedGeometries.push(lidGeo);
      const lidMesh = new THREE.Mesh(lidGeo, capMat);
      lidMesh.position.y = bodyH + neckH + capH / 2;
      lidMesh.castShadow = true;
      this.modelGroup.add(lidMesh);
    } else if (modelType === 'glass-jar' || modelType === 'plastic-jar') {
      const jarGeo = new THREE.CylinderGeometry(R, R * 0.96, bodyH, 64);
      this.allocatedGeometries.push(jarGeo);
      const jarMesh = new THREE.Mesh(jarGeo, bodyMat);
      jarMesh.position.y = bodyH / 2;
      jarMesh.castShadow = true;
      jarMesh.receiveShadow = true;
      this.modelGroup.add(jarMesh);
      this.activeMeshes.push(jarMesh);

      const lidGeo = new THREE.CylinderGeometry(R * 1.02, R * 1.02, capH, 64);
      this.allocatedGeometries.push(lidGeo);
      const lidMesh = new THREE.Mesh(lidGeo, capMat);
      lidMesh.position.y = bodyH + capH / 2;
      lidMesh.castShadow = true;
      this.modelGroup.add(lidMesh);
    } else if (modelType === 'square-bottle' || modelType === 'rectangular-bottle') {
      // Square / Rectangular profile bottle
      const depthVal = modelType === 'rectangular-bottle' ? R * 1.2 : R * 2.0;
      const bottleGeo = new THREE.BoxGeometry(R * 2.0, bodyH, depthVal);
      this.allocatedGeometries.push(bottleGeo);
      const bottleMesh = new THREE.Mesh(bottleGeo, bodyMat);
      bottleMesh.position.y = bodyH / 2;
      bottleMesh.castShadow = true;
      bottleMesh.receiveShadow = true;
      this.modelGroup.add(bottleMesh);
      this.activeMeshes.push(bottleMesh);

      const capGeo = new THREE.CylinderGeometry(R * 0.45, R * 0.45, capH, 32);
      this.allocatedGeometries.push(capGeo);
      const capMesh = new THREE.Mesh(capGeo, capMat);
      capMesh.position.y = bodyH + capH / 2;
      capMesh.castShadow = true;
      this.modelGroup.add(capMesh);
    } else if (modelType === 'perfume-bottle') {
      // Luxury heavy glass perfume base
      const perfumeGeo = new THREE.BoxGeometry(R * 2.2, bodyH * 0.8, R * 1.4);
      this.allocatedGeometries.push(perfumeGeo);
      const perfumeMesh = new THREE.Mesh(perfumeGeo, bodyMat);
      perfumeMesh.position.y = (bodyH * 0.8) / 2;
      perfumeMesh.castShadow = true;
      this.modelGroup.add(perfumeMesh);
      this.activeMeshes.push(perfumeMesh);

      // Metallic atomizer collar & cap
      const atomizerGeo = new THREE.CylinderGeometry(R * 0.4, R * 0.4, capH * 0.7, 32);
      this.allocatedGeometries.push(atomizerGeo);
      const goldMat = new THREE.MeshStandardMaterial({ color: 0xd4af37, metalness: 0.95, roughness: 0.2 });
      this.allocatedMaterials.push(goldMat);
      const atomizerMesh = new THREE.Mesh(atomizerGeo, goldMat);
      atomizerMesh.position.y = (bodyH * 0.8) + capH * 0.35;
      atomizerMesh.castShadow = true;
      this.modelGroup.add(atomizerMesh);
    } else {
      // Cylindrical bottle, cosmetic dropper, shampoo/lotion pump
      const points: THREE.Vector2[] = [];
      const neckR = (dims.neckDiameter || 2.4) / 2;

      points.push(new THREE.Vector2(0, 0));
      points.push(new THREE.Vector2(R * 0.9, 0));
      points.push(new THREE.Vector2(R, 0.4));
      points.push(new THREE.Vector2(R, bodyH * 0.75));
      points.push(new THREE.Vector2(R * 0.9, bodyH * 0.88));
      points.push(new THREE.Vector2(neckR * 1.25, bodyH));
      points.push(new THREE.Vector2(neckR, bodyH + neckH));

      const bottleGeo = new THREE.LatheGeometry(points, 64);
      this.allocatedGeometries.push(bottleGeo);
      const bottleMesh = new THREE.Mesh(bottleGeo, bodyMat);
      bottleMesh.castShadow = true;
      bottleMesh.receiveShadow = true;
      this.modelGroup.add(bottleMesh);
      this.activeMeshes.push(bottleMesh);

      // Cap / Dispenser
      if (modelType === 'shampoo-pump' || modelType === 'lotion-bottle') {
        // Dispenser pump neck + nozzle
        const collarGeo = new THREE.CylinderGeometry(neckR * 1.2, neckR * 1.2, capH * 0.5, 32);
        this.allocatedGeometries.push(collarGeo);
        const collarMesh = new THREE.Mesh(collarGeo, capMat);
        collarMesh.position.y = bodyH + neckH + capH * 0.25;
        this.modelGroup.add(collarMesh);

        // Horizontal spout head
        const spoutGeo = new THREE.BoxGeometry(neckR * 1.2, capH * 0.35, neckR * 2.5);
        this.allocatedGeometries.push(spoutGeo);
        const spoutMesh = new THREE.Mesh(spoutGeo, capMat);
        spoutMesh.position.set(0, bodyH + neckH + capH * 0.8, neckR * 0.5);
        this.modelGroup.add(spoutMesh);
      } else if (modelType === 'cosmetic-dropper') {
        const collarGeo = new THREE.CylinderGeometry(neckR * 1.15, neckR * 1.15, capH * 0.6, 32);
        this.allocatedGeometries.push(collarGeo);
        const collarMesh = new THREE.Mesh(collarGeo, capMat);
        collarMesh.position.y = bodyH + neckH + capH * 0.3;
        collarMesh.castShadow = true;
        this.modelGroup.add(collarMesh);

        const bulbGeo = new THREE.SphereGeometry(neckR * 0.9, 32, 16);
        bulbGeo.scale(1, 1.4, 1);
        this.allocatedGeometries.push(bulbGeo);
        const bulbMat = new THREE.MeshStandardMaterial({ color: 0x181818, roughness: 0.6, metalness: 0.05 });
        this.allocatedMaterials.push(bulbMat);
        const bulbMesh = new THREE.Mesh(bulbGeo, bulbMat);
        bulbMesh.position.y = bodyH + neckH + capH * 0.6 + neckR * 0.9;
        this.modelGroup.add(bulbMesh);
      } else {
        const capGeo = new THREE.CylinderGeometry(neckR * 1.15, neckR * 1.15, capH, 32);
        this.allocatedGeometries.push(capGeo);
        const capMesh = new THREE.Mesh(capGeo, capMat);
        capMesh.position.y = bodyH + neckH + capH / 2;
        capMesh.castShadow = true;
        this.modelGroup.add(capMesh);
      }
    }

    // Applied Label Artwork
    const labelH = dims.labelHeight || bodyH * 0.7;
    const labelY = dims.labelOffset || bodyH * 0.15 + labelH / 2;
    const labelR = R + 0.035;

    if (artworks['wraparoundLabel'] && artworks['wraparoundLabel'].dataUrl) {
      const coverage = (dims.labelCoverage || 0.9) * Math.PI * 2;
      const startAngle = -coverage / 2 + Math.PI / 2;
      const wrapGeo = new THREE.CylinderGeometry(labelR, labelR, labelH, 64, 1, true, startAngle, coverage);
      this.allocatedGeometries.push(wrapGeo);

      const labelMat = this.createPackagingMaterial(artworks['wraparoundLabel'], matSettings, true);
      const wrapMesh = new THREE.Mesh(wrapGeo, labelMat);
      wrapMesh.position.y = labelY;
      wrapMesh.castShadow = true;
      this.modelGroup.add(wrapMesh);
      this.activeMeshes.push(wrapMesh);
    } else {
      const frontArtwork = artworks['frontLabel'] || artworks['front'];
      if (frontArtwork && frontArtwork.dataUrl) {
        const thetaLength = Math.PI * 0.65;
        const thetaStart = -thetaLength / 2 + Math.PI / 2;
        const frontLabelGeo = new THREE.CylinderGeometry(labelR, labelR, labelH, 48, 1, true, thetaStart, thetaLength);
        this.allocatedGeometries.push(frontLabelGeo);

        const frontLabelMat = this.createPackagingMaterial(frontArtwork, matSettings, true);
        const frontLabelMesh = new THREE.Mesh(frontLabelGeo, frontLabelMat);
        frontLabelMesh.position.y = labelY;
        frontLabelMesh.castShadow = true;
        this.modelGroup.add(frontLabelMesh);
        this.activeMeshes.push(frontLabelMesh);
      }

      const backArtwork = artworks['backLabel'] || artworks['back'];
      if (backArtwork && backArtwork.dataUrl) {
        const thetaLength = Math.PI * 0.65;
        const thetaStart = -thetaLength / 2 - Math.PI / 2;
        const backLabelGeo = new THREE.CylinderGeometry(labelR, labelR, labelH, 48, 1, true, thetaStart, thetaLength);
        this.allocatedGeometries.push(backLabelGeo);

        const backLabelMat = this.createPackagingMaterial(backArtwork, matSettings, true);
        const backLabelMesh = new THREE.Mesh(backLabelGeo, backLabelMat);
        backLabelMesh.position.y = labelY;
        backLabelMesh.castShadow = true;
        this.modelGroup.add(backLabelMesh);
        this.activeMeshes.push(backLabelMesh);
      }
    }
  }

  // -------------------------------------------------------------
  // POUCH BUILDER
  // -------------------------------------------------------------
  private buildPouchModel(
    modelType: PackagingModelType,
    dims: PouchDimensions,
    artworks: Record<string, ArtworkMapping>,
    matSettings: MaterialSettings
  ) {
    const W = dims.width || 12;
    const H = dims.height || 18;
    const gussetD = dims.gussetDepth || 5.0;
    const fullness = dims.fullness || 0.6;
    const sealW = dims.sealWidth || 0.8;

    const segX = 32;
    const segY = 48;

    // Front surface
    const frontGeo = new THREE.PlaneGeometry(W, H, segX, segY);
    const fPos = frontGeo.attributes.position;
    for (let i = 0; i < fPos.count; i++) {
      const x = fPos.getX(i);
      const y = fPos.getY(i);
      const nx = x / (W / 2);
      const ny = y / (H / 2);

      const edgeDistX = 1 - Math.abs(nx);
      const edgeDistY = 1 - Math.abs(ny);
      const sealFactor = Math.min(1, edgeDistX * (W / sealW * 0.4)) * Math.min(1, edgeDistY * (H / sealW * 0.4));
      const heightProfile = Math.max(0, 1 - ny) * 0.5 * (1 + 0.3 * (1 - Math.abs(nx)));
      const bulge = Math.sin((1 - Math.abs(nx)) * Math.PI * 0.5) * heightProfile * (gussetD * 0.45 * fullness);

      fPos.setZ(i, bulge * sealFactor);
    }
    frontGeo.computeVertexNormals();
    this.allocatedGeometries.push(frontGeo);

    const frontArtwork = artworks['front'] || artworks['pouchFront'];
    const frontMat = this.createPackagingMaterial(frontArtwork, matSettings);
    frontMat.side = THREE.FrontSide;

    const frontMesh = new THREE.Mesh(frontGeo, frontMat);
    frontMesh.position.y = H / 2;
    frontMesh.castShadow = true;
    frontMesh.receiveShadow = true;
    this.modelGroup.add(frontMesh);
    this.activeMeshes.push(frontMesh);

    // Back surface
    const backGeo = new THREE.PlaneGeometry(W, H, segX, segY);
    const bPos = backGeo.attributes.position;
    for (let i = 0; i < bPos.count; i++) {
      const x = bPos.getX(i);
      const y = bPos.getY(i);
      const nx = x / (W / 2);
      const ny = y / (H / 2);
      const edgeDistX = 1 - Math.abs(nx);
      const edgeDistY = 1 - Math.abs(ny);
      const sealFactor = Math.min(1, edgeDistX * (W / sealW * 0.4)) * Math.min(1, edgeDistY * (H / sealW * 0.4));
      const heightProfile = Math.max(0, 1 - ny) * 0.5 * (1 + 0.3 * (1 - Math.abs(nx)));
      const bulge = Math.sin((1 - Math.abs(nx)) * Math.PI * 0.5) * heightProfile * (gussetD * 0.45 * fullness);

      bPos.setZ(i, -bulge * sealFactor);
    }
    backGeo.computeVertexNormals();
    this.allocatedGeometries.push(backGeo);

    const backArtwork = artworks['back'] || artworks['pouchBack'];
    const backMat = this.createPackagingMaterial(backArtwork, matSettings);
    backMat.side = THREE.FrontSide;

    const backMesh = new THREE.Mesh(backGeo, backMat);
    backMesh.rotation.y = Math.PI;
    backMesh.position.y = H / 2;
    backMesh.castShadow = true;
    backMesh.receiveShadow = true;
    this.modelGroup.add(backMesh);
    this.activeMeshes.push(backMesh);

    // Bottom gusset
    if (modelType !== 'flat-pouch') {
      const gussetR = gussetD * 0.45 * fullness;
      const gussetPoints: THREE.Vector3[] = [];
      const gussetSegments = 24;
      for (let i = 0; i <= gussetSegments; i++) {
        const t = (i / gussetSegments) * Math.PI;
        const x = (Math.cos(t) * W) / 2.1;
        const z = Math.sin(t) * gussetR;
        gussetPoints.push(new THREE.Vector3(x, 0, z));
      }

      const gussetGeo = new THREE.BufferGeometry().setFromPoints(gussetPoints);
      this.allocatedGeometries.push(gussetGeo);
      const gussetMat = new THREE.MeshStandardMaterial({
        color: matSettings.baseColor || 0x222222,
        roughness: 0.4,
        metalness: matSettings.metalness || 0.1,
        side: THREE.DoubleSide,
      });
      this.allocatedMaterials.push(gussetMat);
      const gussetMesh = new THREE.Line(gussetGeo, gussetMat);
      gussetMesh.position.y = 0.05;
      this.modelGroup.add(gussetMesh);
    }

    // Top Heat Seal & Zipper Indentation
    const zipperY = H - (dims.zipperDistance || 2.0);
    const zipperGeo = new THREE.BoxGeometry(W - sealW * 2, 0.08, 0.15);
    this.allocatedGeometries.push(zipperGeo);
    const zipperMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.7, metalness: 0.1 });
    this.allocatedMaterials.push(zipperMat);
    const zipperMesh = new THREE.Mesh(zipperGeo, zipperMat);
    zipperMesh.position.set(0, zipperY, 0.05);
    this.modelGroup.add(zipperMesh);

    // Degassing Valve
    if (modelType === 'coffee-valve-pouch' || dims.hasValve) {
      const valveGeo = new THREE.CylinderGeometry(0.7, 0.7, 0.25, 24);
      this.allocatedGeometries.push(valveGeo);
      const valveMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.5, metalness: 0.3 });
      this.allocatedMaterials.push(valveMat);
      const valveMesh = new THREE.Mesh(valveGeo, valveMat);
      valveMesh.rotation.x = Math.PI / 2;
      valveMesh.position.set(0, H * 0.72, (gussetD * 0.22 * fullness) + 0.1);
      this.modelGroup.add(valveMesh);
    }

    // Corner Spout & Cap for spout pouch
    if (modelType === 'spout-pouch' || dims.hasSpout) {
      const spoutNeckGeo = new THREE.CylinderGeometry(0.5, 0.5, 1.2, 24);
      this.allocatedGeometries.push(spoutNeckGeo);
      const spoutMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3, metalness: 0.05 });
      this.allocatedMaterials.push(spoutMat);
      const spoutMesh = new THREE.Mesh(spoutNeckGeo, spoutMat);
      spoutMesh.position.set(W * 0.32, H - 0.4, 0);
      spoutMesh.rotation.z = -Math.PI / 4;
      this.modelGroup.add(spoutMesh);
    }
  }

  // -------------------------------------------------------------
  // MATERIAL FACTORY
  // -------------------------------------------------------------
  private createPackagingMaterial(
    artwork?: ArtworkMapping,
    matSettings?: MaterialSettings,
    isDecal = false
  ): THREE.MeshStandardMaterial | THREE.MeshPhysicalMaterial {
    const s = matSettings || {
      preset: 'matte-paper',
      baseColor: '#ffffff',
      roughness: 0.6,
      metalness: 0.0,
      clearcoat: 0.0,
      clearcoatRoughness: 0.1,
      transmission: 0.0,
      ior: 1.5,
      opacity: 1.0,
      bumpScale: 0.05,
    };

    let colorMap: THREE.Texture | null = null;
    let bumpMap: THREE.Texture | null = null;

    if (artwork && artwork.dataUrl) {
      const texCanvas = renderProcessedTextureCanvas(artwork, 2048, 2048, s.baseColor);
      colorMap = new THREE.CanvasTexture(texCanvas);
      colorMap.colorSpace = THREE.SRGBColorSpace;
      colorMap.anisotropy = this.renderer.capabilities.getMaxAnisotropy();
      this.allocatedTextures.push(colorMap);

      if (artwork.embossDepth && Math.abs(artwork.embossDepth) > 0.02) {
        const bumpCanvas = generateBumpMapCanvas(texCanvas, artwork.embossDepth);
        bumpMap = new THREE.CanvasTexture(bumpCanvas);
        bumpMap.anisotropy = 4;
        this.allocatedTextures.push(bumpMap);
      }
    }

    let roughness = s.roughness ?? 0.5;
    let metalness = s.metalness ?? 0.0;
    let clearcoat = s.clearcoat ?? 0.0;
    let clearcoatRoughness = s.clearcoatRoughness ?? 0.1;

    switch (s.preset) {
      case 'matte-paper':
        roughness = 0.85;
        metalness = 0.0;
        clearcoat = 0.0;
        break;
      case 'glossy-paper':
        roughness = 0.25;
        metalness = 0.02;
        clearcoat = 0.5;
        break;
      case 'kraft-paper':
        roughness = 0.95;
        metalness = 0.0;
        break;
      case 'matte-laminate':
        roughness = 0.65;
        clearcoat = 0.2;
        clearcoatRoughness = 0.5;
        break;
      case 'gloss-laminate':
        roughness = 0.1;
        clearcoat = 1.0;
        clearcoatRoughness = 0.05;
        break;
      case 'metallic-foil-gold':
        roughness = 0.2;
        metalness = 0.95;
        clearcoat = 0.3;
        break;
      case 'metallic-foil-silver':
        roughness = 0.15;
        metalness = 0.98;
        clearcoat = 0.2;
        break;
      case 'metallic-foil-champagne':
        roughness = 0.22;
        metalness = 0.92;
        break;
      case 'metal-tin':
        roughness = 0.25;
        metalness = 0.95;
        break;
      case 'cosmetic-plastic':
        roughness = 0.35;
        metalness = 0.05;
        clearcoat = 0.4;
        break;
    }

    if (artwork && artwork.foilColor && artwork.foilColor !== 'none') {
      metalness = 0.92;
      roughness = 0.18;
      clearcoat = 0.6;
    }

    const mat = new THREE.MeshPhysicalMaterial({
      color: colorMap ? 0xffffff : new THREE.Color(s.baseColor || '#ffffff'),
      map: colorMap,
      roughness,
      metalness,
      clearcoat,
      clearcoatRoughness,
      bumpMap: bumpMap || undefined,
      bumpScale: (artwork?.embossDepth || 0) * 0.12,
      transparent: isDecal,
      opacity: artwork?.opacity ?? 1.0,
      depthWrite: true,
      polygonOffset: isDecal,
      polygonOffsetFactor: isDecal ? -1 : 0,
      polygonOffsetUnits: isDecal ? -1 : 0,
    });

    this.allocatedMaterials.push(mat);
    return mat;
  }

  private createContainerBodyMaterial(s: MaterialSettings): THREE.Material {
    if (s.preset === 'clear-glass') {
      return new THREE.MeshPhysicalMaterial({
        color: new THREE.Color(0xffffff),
        transmission: 0.95,
        opacity: 1,
        transparent: true,
        roughness: 0.04,
        ior: 1.52,
        thickness: 1.2,
        attenuationColor: new THREE.Color(0xffffff),
        attenuationDistance: 20,
        depthWrite: false,
      });
    }

    if (s.preset === 'frosted-glass') {
      return new THREE.MeshPhysicalMaterial({
        color: new THREE.Color(0xf5f5f5),
        transmission: 0.88,
        opacity: 1,
        transparent: true,
        roughness: 0.38,
        ior: 1.5,
        thickness: 1.5,
        depthWrite: false,
      });
    }

    if (s.preset === 'amber-glass') {
      return new THREE.MeshPhysicalMaterial({
        color: new THREE.Color(0x6b3e15),
        transmission: 0.85,
        opacity: 1,
        transparent: true,
        roughness: 0.08,
        ior: 1.54,
        thickness: 1.5,
        attenuationColor: new THREE.Color(0x3b200b),
        attenuationDistance: 8,
        depthWrite: false,
      });
    }

    if (s.preset === 'metal-tin') {
      return new THREE.MeshStandardMaterial({
        color: new THREE.Color(s.baseColor || 0xcccccc),
        metalness: 0.95,
        roughness: 0.22,
      });
    }

    return new THREE.MeshStandardMaterial({
      color: new THREE.Color(s.baseColor || 0xffffff),
      roughness: 0.2,
      metalness: 0.05,
    });
  }

  private createCapMaterial(s: MaterialSettings): THREE.Material {
    const capStyle = s.capMaterial || 'matte-plastic';
    const color = new THREE.Color(s.capColor || 0x1a1a1a);

    if (capStyle === 'gold-metal') {
      return new THREE.MeshStandardMaterial({
        color: new THREE.Color(0xd4af37),
        metalness: 0.95,
        roughness: 0.18,
      });
    }

    if (capStyle === 'silver-metal') {
      return new THREE.MeshStandardMaterial({
        color: new THREE.Color(0xe0e0e0),
        metalness: 0.98,
        roughness: 0.15,
      });
    }

    if (capStyle === 'gloss-plastic') {
      return new THREE.MeshStandardMaterial({ color, roughness: 0.1, metalness: 0.05 });
    }

    if (capStyle === 'natural-wood') {
      return new THREE.MeshStandardMaterial({ color: new THREE.Color(0xc29b68), roughness: 0.7, metalness: 0.0 });
    }

    return new THREE.MeshStandardMaterial({ color, roughness: 0.75, metalness: 0.05 });
  }

  // -------------------------------------------------------------
  // STUDIO LIGHTING & BACKGROUND
  // -------------------------------------------------------------
  public updateLighting(settings: LightingSettings) {
    const exp = settings.exposure ?? 1.1;
    this.renderer.toneMappingExposure = exp;

    const key = settings.keyIntensity ?? 2.0;
    const fill = settings.fillIntensity ?? 1.2;
    const rim = settings.rimIntensity ?? 1.5;
    const amb = settings.ambientIntensity ?? 0.4;

    switch (settings.preset) {
      case 'luxury-product':
        this.keyLight.intensity = key * 1.3;
        this.fillLight.intensity = fill * 0.7;
        this.rimLight.intensity = rim * 1.8;
        this.ambientLight.intensity = amb * 0.5;
        break;
      case 'ecommerce-bright':
        this.keyLight.intensity = key * 1.4;
        this.fillLight.intensity = fill * 1.4;
        this.rimLight.intensity = rim * 1.0;
        this.ambientLight.intensity = amb * 1.3;
        break;
      case 'dramatic-dark':
        this.keyLight.intensity = key * 1.6;
        this.fillLight.intensity = fill * 0.2;
        this.rimLight.intensity = rim * 2.2;
        this.ambientLight.intensity = amb * 0.2;
        break;
      case 'natural-daylight':
        this.keyLight.intensity = key * 1.1;
        this.fillLight.intensity = fill * 1.1;
        this.rimLight.intensity = rim * 0.8;
        this.ambientLight.intensity = amb * 0.8;
        break;
      case 'soft-studio':
      default:
        this.keyLight.intensity = key;
        this.fillLight.intensity = fill;
        this.rimLight.intensity = rim;
        this.ambientLight.intensity = amb;
        break;
    }

    const angle = ((settings.lightAngle || 45) * Math.PI) / 180;
    this.keyLight.position.set(Math.cos(angle) * 25, 25, Math.sin(angle) * 25);
  }

  public updateBackground(settings: BackgroundSettings) {
    const { preset, customColor, showFloorShadow, showFloorReflection, reflectionOpacity } = settings;

    let hexColor: string | null = null;
    switch (preset) {
      case 'pure-white':
        hexColor = '#ffffff';
        break;
      case 'light-grey':
        hexColor = '#f1f5f9';
        break;
      case 'dark-charcoal':
        hexColor = '#0f172a';
        break;
      case 'warm-beige':
        hexColor = '#f5ebe0';
        break;
      case 'luxury-black':
        hexColor = '#080808';
        break;
      case 'custom':
        hexColor = customColor || '#18181b';
        break;
      case 'transparent':
        hexColor = null;
        break;
    }

    if (hexColor) {
      this.scene.background = new THREE.Color(hexColor);
      this.renderer.setClearColor(new THREE.Color(hexColor), 1.0);
    } else {
      this.scene.background = null;
      this.renderer.setClearColor(0x000000, 0.0);
    }

    if (this.contactShadowMesh) {
      this.contactShadowMesh.visible = showFloorShadow !== false;
    }

    if (this.floorReflectionMesh) {
      this.floorReflectionMesh.visible = !!showFloorReflection && preset !== 'transparent';
      if (this.floorReflectionMesh.material instanceof THREE.MeshStandardMaterial) {
        this.floorReflectionMesh.material.color.set(hexColor || '#111111');
        this.floorReflectionMesh.material.roughness = 0.2;
        this.floorReflectionMesh.material.opacity = reflectionOpacity ?? 0.4;
      }
    }
  }

  // -------------------------------------------------------------
  // GENUINE HIGH-RESOLUTION PNG EXPORT PIPELINE
  // -------------------------------------------------------------
  public async renderHighResPng(
    width: number,
    height: number,
    transparentBg: boolean,
    cameraAngle?: CameraPreset
  ): Promise<string> {
    const origWidth = this.canvas.width;
    const origHeight = this.canvas.height;
    const origPixelRatio = this.renderer.getPixelRatio();
    const origBg = this.scene.background;
    const origClearColor = new THREE.Color();
    const origClearAlpha = this.renderer.getClearAlpha();
    this.renderer.getClearColor(origClearColor);

    const origCamPos = this.camera.position.clone();
    const origCamTarget = this.controls.target.clone();

    if (cameraAngle) {
      this.setCameraPreset(cameraAngle, false);
    }

    if (transparentBg) {
      this.scene.background = null;
      this.renderer.setClearColor(0x000000, 0.0);
      if (this.floorReflectionMesh) this.floorReflectionMesh.visible = false;
    }

    this.renderer.setPixelRatio(1);
    this.renderer.setSize(width, height, false);

    if (this.camera instanceof THREE.PerspectiveCamera) {
      this.camera.aspect = width / height;
      this.camera.updateProjectionMatrix();
    } else if (this.camera instanceof THREE.OrthographicCamera) {
      const frustumSize = 28;
      const aspect = width / height;
      this.camera.left = (-frustumSize * aspect) / 2;
      this.camera.right = (frustumSize * aspect) / 2;
      this.camera.top = frustumSize / 2;
      this.camera.bottom = -frustumSize / 2;
      this.camera.updateProjectionMatrix();
    }

    this.renderer.render(this.scene, this.camera);
    const dataUrl = this.canvas.toDataURL('image/png');

    this.renderer.setPixelRatio(origPixelRatio);
    this.renderer.setSize(origWidth / origPixelRatio, origHeight / origPixelRatio, false);
    this.scene.background = origBg;
    this.renderer.setClearColor(origClearColor, origClearAlpha);
    if (this.floorReflectionMesh) this.floorReflectionMesh.visible = true;

    this.camera.position.copy(origCamPos);
    this.controls.target.copy(origCamTarget);
    this.controls.update();
    this.handleResize();

    return dataUrl;
  }

  // -------------------------------------------------------------
  // ANIMATION LOOP
  // -------------------------------------------------------------
  private startRenderLoop() {
    let lastTime = performance.now();

    const loop = (currentTime: number) => {
      this.animationFrameId = requestAnimationFrame(loop);
      const delta = (currentTime - lastTime) / 1000;
      lastTime = currentTime;

      if (this.isCameraTransitioning) {
        this.camera.position.lerp(this.targetCameraPos, 0.08);
        if (this.camera.position.distanceTo(this.targetCameraPos) < 0.05) {
          this.camera.position.copy(this.targetCameraPos);
          this.isCameraTransitioning = false;
        }
      }

      if (this.isTurntableActive) {
        this.modelGroup.rotation.y += delta * this.turntableSpeed;
      }

      this.controls.update();
      this.renderer.render(this.scene, this.camera);
    };

    this.animationFrameId = requestAnimationFrame(loop);
  }

  public dispose() {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
    }
    window.removeEventListener('resize', this.handleResize);

    this.disposeCurrentModel();

    if (this.envTexture) this.envTexture.dispose();
    this.pmremGenerator.dispose();
    this.controls.dispose();
    this.renderer.dispose();
  }
}
