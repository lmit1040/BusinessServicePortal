import { useState, useEffect } from 'react';
import { X, Plus, Trash2, Play } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Database } from '../lib/database.types';
import { FileUpload } from './FileUpload';
import { VideoPlayer } from './VideoPlayer';
import { parseVideoUrl } from '../lib/video-utils';

type ServiceOffer = Database['public']['Tables']['service_offers']['Row'];
type Category = Database['public']['Tables']['service_categories']['Row'];

interface OfferModalProps {
  offer: ServiceOffer | null;
  categories: Category[];
  onClose: () => void;
  onSave: () => void;
}

export function OfferModal({ offer, categories, onClose, onSave }: OfferModalProps) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category_id: '',
    price_monthly: 0,
    price_yearly: 0,
    is_active: true,
    features: [''],
    product_link: '',
    product_image: '',
    product_video: '',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (offer) {
      setFormData({
        title: offer.title,
        description: offer.description,
        category_id: offer.category_id || '',
        price_monthly: Number(offer.price_monthly),
        price_yearly: Number(offer.price_yearly),
        is_active: offer.is_active,
        features: Array.isArray(offer.features) && offer.features.length > 0 ? offer.features : [''],
        product_link: offer.product_link || '',
        product_image: offer.product_image || '',
        product_video: offer.product_video || '',
      });
    }
  }, [offer]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const features = formData.features.filter((f) => f.trim() !== '');

    const data = {
      title: formData.title,
      description: formData.description,
      category_id: formData.category_id || null,
      price_monthly: formData.price_monthly,
      price_yearly: formData.price_yearly,
      is_active: formData.is_active,
      features,
      product_link: formData.product_link.trim() || null,
      product_image: formData.product_image.trim() || null,
      product_video: formData.product_video.trim() || null,
    };

    if (offer) {
      await supabase.from('service_offers').update(data).eq('id', offer.id);
    } else {
      await supabase.from('service_offers').insert(data);
    }

    setSaving(false);
    onSave();
  };

  const addFeature = () => {
    setFormData({ ...formData, features: [...formData.features, ''] });
  };

  const removeFeature = (index: number) => {
    const newFeatures = formData.features.filter((_, i) => i !== index);
    setFormData({ ...formData, features: newFeatures.length > 0 ? newFeatures : [''] });
  };

  const updateFeature = (index: number, value: string) => {
    const newFeatures = [...formData.features];
    newFeatures[index] = value;
    setFormData({ ...formData, features: newFeatures });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-slate-900">{offer ? 'Edit Offer' : 'Create New Offer'}</h2>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Title</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Category</label>
            <select
              value={formData.category_id}
              onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">No Category</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Monthly Price ($)</label>
              <input
                type="number"
                step="0.01"
                value={formData.price_monthly}
                onChange={(e) => setFormData({ ...formData, price_monthly: parseFloat(e.target.value) || 0 })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Yearly Price ($)</label>
              <input
                type="number"
                step="0.01"
                value={formData.price_yearly}
                onChange={(e) => setFormData({ ...formData, price_yearly: parseFloat(e.target.value) || 0 })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-slate-700">Features</label>
              <button
                type="button"
                onClick={addFeature}
                className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                <Plus className="w-4 h-4" />
                Add Feature
              </button>
            </div>
            <div className="space-y-2">
              {formData.features.map((feature, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    type="text"
                    value={feature}
                    onChange={(e) => updateFeature(index, e.target.value)}
                    className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter a feature"
                  />
                  {formData.features.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeFeature(index)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="border-t border-slate-200 pt-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Product Media</h3>

            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Product Link (Optional)
                </label>
                <input
                  type="url"
                  value={formData.product_link}
                  onChange={(e) => setFormData({ ...formData, product_link: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="https://example.com/product"
                />
                <p className="text-xs text-slate-500 mt-1">Link to product page or external resource</p>
              </div>

              <FileUpload
                bucket="product-images"
                accept="image/*"
                maxSizeMB={10}
                currentFileUrl={formData.product_image}
                onUploadComplete={(url) => setFormData({ ...formData, product_image: url })}
                onDelete={() => setFormData({ ...formData, product_image: '' })}
                label="Product Image (Optional)"
                description="Upload a product image (max 10MB)"
              />
              {formData.product_image && (
                <div className="mt-3 border border-slate-200 rounded-lg p-2">
                  <img
                    src={formData.product_image}
                    alt="Product preview"
                    className="max-h-32 rounded object-contain"
                    onError={(e) => {
                      e.currentTarget.src = '';
                      e.currentTarget.alt = 'Invalid image URL';
                      e.currentTarget.className = 'text-red-500 text-sm';
                    }}
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Product Video (Optional)
                </label>
                <input
                  type="url"
                  value={formData.product_video}
                  onChange={(e) => setFormData({ ...formData, product_video: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="https://www.youtube.com/watch?v=... or upload below"
                />
                <p className="text-xs text-slate-500 mt-1">YouTube, Vimeo, direct video URL, or upload a file</p>
              </div>

              {!formData.product_video && (
                <FileUpload
                  bucket="product-videos"
                  accept="video/*"
                  maxSizeMB={100}
                  currentFileUrl={formData.product_video}
                  onUploadComplete={(url) => setFormData({ ...formData, product_video: url })}
                  onDelete={() => setFormData({ ...formData, product_video: '' })}
                  label="Or Upload Video File"
                  description="Upload a product video (max 100MB)"
                />
              )}

              {formData.product_video && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-700">Video Preview</span>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, product_video: '' })}
                      className="text-sm text-red-600 hover:text-red-700 font-medium"
                    >
                      Remove Video
                    </button>
                  </div>
                  <div className="border border-slate-200 rounded-lg overflow-hidden aspect-video bg-slate-900">
                    <VideoPlayer
                      url={formData.product_video}
                      title={formData.title}
                      autoPlay={false}
                      className="w-full h-full"
                      showControls={true}
                    />
                  </div>
                  {parseVideoUrl(formData.product_video).type === 'unknown' && (
                    <p className="text-xs text-amber-600">Warning: Video format may not be supported</p>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="is_active"
              checked={formData.is_active}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="is_active" className="text-sm font-medium text-slate-700">
              Active (visible to users)
            </label>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-slate-300 text-slate-700 font-medium rounded-lg hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
            >
              {saving ? 'Saving...' : offer ? 'Update Offer' : 'Create Offer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
