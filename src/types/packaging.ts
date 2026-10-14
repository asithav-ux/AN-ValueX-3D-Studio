export type PackagingCategory = 'box' | 'label' | 'pouch';

export type MeasurementUnit = 'mm' | 'cm' | 'in';

export type BoxType =
  | 'folding-carton'
  | 'square-box'
  | 'tall-carton'
  | 'cosmetic-box'
  | 'tuck-end-carton'
  | 'reverse-tuck-end'
  | 'straight-tuck-end'
  | 'auto-bottom-carton'
  | 'sleeve-box'
  | 'rigid-gift-box'
  | 'lid-and-base'
  | 'drawer-box'
  | 'cylinder-tube';

export type LabelPackagingType =
  | 'cylindrical-bottle'
  | 'square-bottle'
  | 'rectangular-bottle'
  | 'oval-bottle'
  | 'cosmetic-dropper'
  | 'shampoo-pump'
  | 'lotion-bottle'
  | 'perfume-bottle'
  | 'glass-jar'
  | 'plastic-jar'
  | 'metal-tin'
  | 'flat-container';

export type PouchType =
  | 'flat-pouch'
  | 'stand-up-pouch'
  | 'zipper-pouch'
  | 'doypack-gusset'
  | 'side-gusset-pouch'
  | 'bottom-gusset-pouch'
  | 'flat-bottom-pouch'
  | 'quad-seal-pouch'
  | 'coffee-valve-pouch'
  | 'spout-pouch';

export type PackagingModelType = BoxType | LabelPackagingType | PouchType;

export interface BoxDimensions {
  width: number; // stored in base cm
  height: number;
  depth: number;
  paperThickness: number; // in mm
  creaseRadius: number;
  lidHeight?: number; // for rigid lid-and-base / sleeve
  trayOffset?: number; // for drawer box
}

export interface LabelDimensions {
  diameter: number; // width/diameter in cm
  height: number; // in cm
  depth?: number; // for square/rectangular/oval bottles
  neckDiameter: number;
  neckHeight: number;
  capHeight: number;
  labelCoverage: number; // 0.1 to 1.0 (portion of circumference)
  labelHeight: number; // cm
  labelOffset: number; // vertical offset from bottom in cm
  labelType: 'front' | 'back' | 'wraparound';
  shape?: 'round' | 'square' | 'rectangular' | 'oval';
  hasPump?: boolean;
}

export interface PouchDimensions {
  width: number; // in cm
  height: number;
  gussetDepth: number; // bottom / side gusset expansion in cm
  sealWidth: number; // perimeter heat seal width in cm (e.g. 0.8)
  zipperDistance: number; // distance from top seal to zipper in cm
  fullness: number; // volumetric expansion bulge factor 0.1 - 1.0
  hasTearNotch: boolean;
  hasValve: boolean;
  hasSpout?: boolean;
}

export type BoxPanelId = 'front' | 'back' | 'left' | 'right' | 'top' | 'bottom';
export type LabelPanelId = 'frontLabel' | 'backLabel' | 'wraparoundLabel' | 'cap' | 'body';
export type PouchPanelId = 'front' | 'back' | 'bottomGusset';

export type PanelId = BoxPanelId | LabelPanelId | PouchPanelId;

export type FoilColor = 'none' | 'gold' | 'champagne' | 'silver' | 'copper' | 'rosegold';

export interface ArtworkMapping {
  panelId: string;
  dataUrl: string;
  fileName: string;
  fileSize: number;
  naturalWidth: number;
  naturalHeight: number;
  aspectRatio: number;
  fit: 'fit' | 'fill' | 'stretch' | 'custom';
  scale: number; // 0.2 to 3.0
  offsetX: number; // -1 to 1
  offsetY: number; // -1 to 1
  rotation: number; // 0, 90, 180, 270
  // Surface finishing effects
  foilColor: FoilColor;
  foilThreshold: number; // 0 to 1
  embossDepth: number; // -1 to 1 (-1 deboss, +1 emboss)
  spotVarnish: boolean; // extra gloss on non-transparent artwork parts
  opacity: number;
}

export type MaterialPresetId =
  | 'matte-paper'
  | 'glossy-paper'
  | 'kraft-paper'
  | 'matte-laminate'
  | 'gloss-laminate'
  | 'metallic-foil-gold'
  | 'metallic-foil-silver'
  | 'metallic-foil-champagne'
  | 'clear-glass'
  | 'frosted-glass'
  | 'amber-glass'
  | 'cosmetic-plastic'
  | 'metal-tin';

export interface MaterialSettings {
  preset: MaterialPresetId;
  baseColor: string;
  roughness: number;
  metalness: number;
  clearcoat: number;
  clearcoatRoughness: number;
  transmission: number;
  ior: number;
  opacity: number;
  bumpScale: number;
  capColor?: string;
  capMaterial?: 'matte-plastic' | 'gloss-plastic' | 'gold-metal' | 'silver-metal' | 'natural-wood';
}

export type StudioLightingPresetId =
  | 'soft-studio'
  | 'luxury-product'
  | 'ecommerce-bright'
  | 'dramatic-dark'
  | 'natural-daylight';

export interface LightingSettings {
  preset: StudioLightingPresetId;
  keyIntensity: number;
  fillIntensity: number;
  rimIntensity: number;
  ambientIntensity: number;
  lightAngle: number;
  shadowSoftness: number;
  exposure: number;
}

export type BackgroundPresetId =
  | 'pure-white'
  | 'light-grey'
  | 'dark-charcoal'
  | 'warm-beige'
  | 'luxury-black'
  | 'custom'
  | 'transparent';

export interface BackgroundSettings {
  preset: BackgroundPresetId;
  customColor: string;
  showFloorShadow: boolean;
  showFloorReflection: boolean;
  reflectionOpacity: number;
}

export interface CameraSettings {
  fov: number;
  orthographic: boolean;
  distance: number;
  targetY: number;
  angleX: number;
  angleY: number;
}

export interface PackagingProject {
  id: string;
  userId?: string;
  name: string;
  category: PackagingCategory;
  modelType: PackagingModelType;
  displayUnit: MeasurementUnit; // 'mm' | 'cm' | 'in'
  boxDimensions: BoxDimensions;
  labelDimensions: LabelDimensions;
  pouchDimensions: PouchDimensions;
  artworks: Record<string, ArtworkMapping>;
  material: MaterialSettings;
  lighting: LightingSettings;
  background: BackgroundSettings;
  camera: CameraSettings;
  isPublicShare?: boolean;
  shareToken?: string;
  shareCreatedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  company?: string;
  avatar?: string;
  createdAt: string;
  isVerified: boolean;
}

export interface CustomModelTemplate {
  id: string;
  userId: string;
  name: string;
  category: PackagingCategory;
  modelType: PackagingModelType;
  displayUnit: MeasurementUnit;
  dimensions: BoxDimensions | LabelDimensions | PouchDimensions;
  createdAt: string;
}

export type CameraPreset = 'front' | 'back' | 'left' | 'right' | 'top' | 'bottom' | 'three-quarter';
