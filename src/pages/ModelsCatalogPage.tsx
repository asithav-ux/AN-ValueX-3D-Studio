import React, { useState } from 'react';
import {
  Box,
  Layers,
  ArrowRight,
  Sparkles,
  Sliders,
  Check,
  Search
} from 'lucide-react';
import type { PackagingCategory, PackagingModelType } from '../types/packaging';

interface ModelsCatalogPageProps {
  onNavigate: (path: string) => void;
  onSelectModelForStudio: (category: PackagingCategory, modelType: PackagingModelType) => void;
}

export const ModelsCatalogPage: React.FC<ModelsCatalogPageProps> = ({
  onNavigate,
  onSelectModelForStudio,
}) => {
  const [activeFilter, setActiveFilter] = useState<'all' | 'box' | 'label' | 'pouch'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const catalogItems: Array<{
    id: PackagingModelType;
    category: PackagingCategory;
    name: string;
    desc: string;
    specs: string;
    tags: string[];
  }> = [
    // Box Packaging
    {
      id: 'folding-carton',
      category: 'box',
      name: 'Standard Folding Carton',
      desc: 'The ubiquitous packaging carton for pharmaceuticals, food, and electronics with standard tuck closures.',
      specs: 'W: 30-300mm · H: 40-400mm · D: 20-250mm',
      tags: ['Retail', 'Pharmaceutical', 'ECMA / FEFCO'],
    },
    {
      id: 'cosmetic-box',
      category: 'box',
      name: 'Luxury Cosmetic Box',
      desc: 'Beveled corners, thick premium board caliper, and tight corner tolerances for beauty serums and fragrances.',
      specs: 'W: 30-150mm · H: 60-250mm · D: 30-150mm',
      tags: ['Luxury Beauty', 'Skincare', 'Perfume'],
    },
    {
      id: 'square-box',
      category: 'box',
      name: 'Square Cube Box',
      desc: 'Equilateral dimension ratio carton ideal for candles, artisan confectionary, and tech accessories.',
      specs: 'W: 50-250mm · Equal W=D',
      tags: ['Confectionery', 'Candles', 'Tech'],
    },
    {
      id: 'tall-carton',
      category: 'box',
      name: 'Tall Tea Carton',
      desc: 'Elongated packaging box tailored for premium loose leaf tea, incense, and beverage accessories.',
      specs: 'H: 140-350mm · Slender Profile',
      tags: ['Tea', 'Beverage', 'Specialty'],
    },
    {
      id: 'tuck-end-carton',
      category: 'box',
      name: 'Tuck-End Carton',
      desc: 'Top and bottom tuck flaps with friction lock edges and precise crease lines.',
      specs: 'Friction lock edges · Caliper 300-800μm',
      tags: ['Prepress Standard', 'Carton'],
    },
    {
      id: 'sleeve-box',
      category: 'box',
      name: 'Sleeve & Inner Tray Box',
      desc: 'Two-piece packaging featuring a sliding outer printed sleeve and a nested interior product tray.',
      specs: 'Outer Sleeve + Sliding Inner Core',
      tags: ['Confectionery', 'Chocolates', 'Electronics'],
    },
    {
      id: 'rigid-gift-box',
      category: 'box',
      name: 'Rigid Gift Box (Shoulder Lip)',
      desc: 'Heavy cardboard rigid box with a distinct base and overlapping friction lid lip.',
      specs: 'Rigid chipboard 1.2-2.5mm · Friction fit',
      tags: ['Watches', 'Jewelry', 'Luxury'],
    },
    {
      id: 'drawer-box',
      category: 'box',
      name: 'Drawer Box with Ribbon Pull',
      desc: 'Sliding matchbox-style carton with satin pull ribbon for premium unboxing experiences.',
      specs: 'Pull-out tray · Ribbon pull accessory',
      tags: ['Gift Set', 'Chocolates', 'Luxury'],
    },
    {
      id: 'cylinder-tube',
      category: 'box',
      name: 'Round Cylinder Tube Box',
      desc: 'Spiral-wound paperboard tube with rolled paper or tinplate top and bottom lids.',
      specs: 'Diameter Ø: 30-160mm · H: 80-350mm',
      tags: ['Spirits', 'Tea Canister', 'Cosmetics'],
    },

    // Bottle & Container Packaging
    {
      id: 'cylindrical-bottle',
      category: 'label',
      name: 'Cylindrical Glass Bottle',
      desc: 'Universal glass or PET bottle for cold brew coffee, kombucha, wine, spirits, and craft beverages.',
      specs: 'Ø: 30-160mm · H: 80-350mm · 360° Wrap Label',
      tags: ['Beverages', 'Cold Brew', 'Wine'],
    },
    {
      id: 'cosmetic-dropper',
      category: 'label',
      name: 'Cosmetic Dropper Bottle',
      desc: 'Serum bottle featuring a pipette collar and rubber suction bulb for facial oils and active serums.',
      specs: 'Volume: 15-100ml · Amber or Clear Glass',
      tags: ['Skincare', 'Serums', 'Oils'],
    },
    {
      id: 'square-bottle',
      category: 'label',
      name: 'Square Profile Bottle',
      desc: 'Modern angular silhouette bottle ideal for artisan olive oils, craft gin, and room fragrance diffusers.',
      specs: 'Square cross-section · Front/Back/Wrap Label',
      tags: ['Olive Oil', 'Spirits', 'Diffusers'],
    },
    {
      id: 'shampoo-pump',
      category: 'label',
      name: 'Lotion & Shampoo Pump Bottle',
      desc: 'Commercial cosmetic bottle with an ergonomic mechanical dispensing pump nozzle.',
      specs: 'Volume: 200-500ml · Dispenser head',
      tags: ['Haircare', 'Bodycare', 'Soap'],
    },
    {
      id: 'perfume-bottle',
      category: 'label',
      name: 'Luxury Perfume Flacon',
      desc: 'Thick-walled heavy base glass bottle fitted with a metallic atomizer collar and polished cap.',
      specs: 'Heavy base glass · Gold/Chrome atomizer',
      tags: ['Fragrance', 'Parfum', 'Luxury'],
    },
    {
      id: 'glass-jar',
      category: 'label',
      name: 'Wide Glass Cream Jar',
      desc: 'Squat cylindrical jar for face moisturizers, masks, gourmet honey, and high-end preserves.',
      specs: 'Volume: 30-250ml · Threaded lid',
      tags: ['Creams', 'Gourmet Food', 'Cosmetics'],
    },
    {
      id: 'metal-tin',
      category: 'label',
      name: 'Metal Tinplate Canister',
      desc: 'Seamless or welded tinplate canister with a slip-on friction lid for specialty tea and biscuits.',
      specs: 'Brushed or Polished Tin · Slip Lid',
      tags: ['Tea Caddy', 'Biscuits', 'Confectionery'],
    },

    // Pouch Packaging
    {
      id: 'stand-up-pouch',
      category: 'pouch',
      name: 'Standard Stand-Up Doypack',
      desc: 'Industry-standard flexible barrier pouch with expanding bottom gusset and top heat seal.',
      specs: 'W: 80-280mm · H: 100-350mm · Expanding Gusset',
      tags: ['Coffee', 'Snacks', 'Superfoods'],
    },
    {
      id: 'zipper-pouch',
      category: 'pouch',
      name: 'Resealable Grip-Zipper Pouch',
      desc: 'Doypack pouch featuring a tactile press-to-close zipper and laser tear notches for multiple uses.',
      specs: 'Press-to-close zipper · Laser tear notch',
      tags: ['Food', 'Powders', 'Pet Treats'],
    },
    {
      id: 'coffee-valve-pouch',
      category: 'pouch',
      name: 'Coffee Degassing Valve Pouch',
      desc: 'Specialty coffee bean pouch equipped with an integrated one-way degassing aroma valve.',
      specs: 'Integrated one-way aroma valve',
      tags: ['Roasted Coffee', 'Whole Bean'],
    },
    {
      id: 'spout-pouch',
      category: 'pouch',
      name: 'Liquid Spout Pouch',
      desc: 'Corner-welded or center top pouring spout with tamper-evident threaded screw cap.',
      specs: 'Welded spout · Liquid barrier film',
      tags: ['Beverages', 'Liquid Refills', 'Sauces'],
    },
    {
      id: 'flat-pouch',
      category: 'pouch',
      name: 'Flat 3-Side Seal Sachet',
      desc: 'Single-serve airtight barrier pouch for sample products, face sheet masks, and seasoning spices.',
      specs: '3-side heat sealed border · Flat profile',
      tags: ['Samples', 'Face Masks', 'Spices'],
    },
  ];

  const filteredItems = catalogItems.filter((item) => {
    const matchesCategory = activeFilter === 'all' || item.category === activeFilter;
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.desc.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const handleOpenModel = (item: typeof catalogItems[0]) => {
    onSelectModelForStudio(item.category, item.id);
    onNavigate('/studio');
  };

  return (
    <div className="w-full bg-neutral-950 text-neutral-100 py-16 px-6 md:px-12 select-none">
      <div className="max-w-7xl mx-auto space-y-12">
        {/* Title */}
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-semibold">
            <Box className="w-3.5 h-3.5" />
            <span>3D Structural Library</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-white tracking-tight">
            Packaging Model Catalog
          </h1>
          <p className="text-neutral-400 text-sm leading-relaxed">
            Select any structural packaging model to load it into the 3D Studio with parametric dimension controls.
          </p>
        </div>

        {/* Filter and Search Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-2 bg-neutral-900/60 border border-neutral-800 rounded-2xl">
          {/* Segmented Filter */}
          <div className="flex items-center gap-1.5 p-1 bg-neutral-950 rounded-xl border border-neutral-800/80 w-full sm:w-auto">
            {(['all', 'box', 'label', 'pouch'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setActiveFilter(f)}
                className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-xs font-medium capitalize transition-colors ${
                  activeFilter === f
                    ? 'bg-neutral-800 text-amber-300 font-semibold shadow-sm'
                    : 'text-neutral-400 hover:text-neutral-200'
                }`}
              >
                {f === 'all' ? 'All Models' : f === 'box' ? 'Boxes & Cartons' : f === 'label' ? 'Bottles & Jars' : 'Pouches'}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search packaging models..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl pl-9 pr-3 py-2 text-xs text-neutral-200 outline-none focus:border-amber-500"
            />
          </div>
        </div>

        {/* Models Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              className="p-6 rounded-2xl bg-neutral-900/40 border border-neutral-800 hover:border-amber-500/60 transition-all flex flex-col justify-between space-y-4 group"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    {item.category === 'box' ? 'Carton' : item.category === 'label' ? 'Container' : 'Pouch'}
                  </span>
                  <span className="text-[11px] font-mono text-neutral-500">{item.specs}</span>
                </div>

                <h3 className="text-base font-bold text-white group-hover:text-amber-300 transition-colors">
                  {item.name}
                </h3>
                <p className="text-xs text-neutral-400 leading-relaxed">{item.desc}</p>

                <div className="flex flex-wrap gap-1.5 pt-1">
                  {item.tags.map((tag) => (
                    <span key={tag} className="text-[10px] text-neutral-400 bg-neutral-950 px-2 py-0.5 rounded border border-neutral-800/80">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              <button
                onClick={() => handleOpenModel(item)}
                className="w-full py-2.5 bg-neutral-800 hover:bg-amber-500 hover:text-neutral-950 text-neutral-100 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
              >
                <span>Open in 3D Studio</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
