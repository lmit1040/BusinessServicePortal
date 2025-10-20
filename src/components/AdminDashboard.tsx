import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Plus, Edit2, Trash2, Users, Package, CheckCircle, Clock, XCircle, ExternalLink, Image as ImageIcon, Video, Play } from 'lucide-react';
import type { Database } from '../lib/database.types';
import { OfferModal } from './OfferModal';
import { MediaManager } from './MediaManager';
import { VideoModal } from './VideoModal';

type ServiceOffer = Database['public']['Tables']['service_offers']['Row'] & {
  service_categories: Database['public']['Tables']['service_categories']['Row'] | null;
};
type UserSubscription = Database['public']['Tables']['user_subscriptions']['Row'] & {
  service_offers: Database['public']['Tables']['service_offers']['Row'] | null;
  profiles: Database['public']['Tables']['profiles']['Row'] | null;
};
type Category = Database['public']['Tables']['service_categories']['Row'];

export function AdminDashboard() {
  const [offers, setOffers] = useState<ServiceOffer[]>([]);
  const [subscriptions, setSubscriptions] = useState<UserSubscription[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingOffer, setEditingOffer] = useState<ServiceOffer | null>(null);
  const [activeTab, setActiveTab] = useState<'offers' | 'subscriptions' | 'media'>('offers');
  const [playingVideo, setPlayingVideo] = useState<{ url: string; title: string } | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const [offersResult, subsResult, catsResult] = await Promise.all([
      supabase.from('service_offers').select('*, service_categories(*)').order('created_at', { ascending: false }),
      supabase.from('user_subscriptions').select('*, service_offers(*), profiles(*)').order('created_at', { ascending: false }),
      supabase.from('service_categories').select('*').order('name'),
    ]);

    if (offersResult.data) setOffers(offersResult.data as ServiceOffer[]);
    if (subsResult.data) setSubscriptions(subsResult.data as UserSubscription[]);
    if (catsResult.data) setCategories(catsResult.data);
    setLoading(false);
  };

  const handleDeleteOffer = async (id: string) => {
    if (!confirm('Are you sure you want to delete this offer?')) return;

    await supabase.from('service_offers').delete().eq('id', id);
    await fetchData();
  };

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    await supabase.from('service_offers').update({ is_active: !currentStatus }).eq('id', id);
    await fetchData();
  };

  const handleUpdateSubscriptionStatus = async (id: string, status: 'active' | 'pending' | 'cancelled') => {
    await supabase.from('user_subscriptions').update({ status }).eq('id', id);
    await fetchData();
  };

  const handleUpdateSubscriptionNotes = async (id: string, notes: string) => {
    await supabase.from('user_subscriptions').update({ notes }).eq('id', id);
    await fetchData();
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-amber-600" />;
      case 'cancelled':
        return <XCircle className="w-4 h-4 text-red-600" />;
      default:
        return null;
    }
  };

  const stats = {
    totalOffers: offers.length,
    activeOffers: offers.filter((o) => o.is_active).length,
    totalSubscriptions: subscriptions.length,
    activeSubscriptions: subscriptions.filter((s) => s.status === 'active').length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-6">Admin Dashboard</h1>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 mb-1">Total Offers</p>
                <p className="text-2xl font-bold text-slate-900">{stats.totalOffers}</p>
              </div>
              <Package className="w-8 h-8 text-blue-600" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 mb-1">Active Offers</p>
                <p className="text-2xl font-bold text-green-600">{stats.activeOffers}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 mb-1">Total Subscriptions</p>
                <p className="text-2xl font-bold text-slate-900">{stats.totalSubscriptions}</p>
              </div>
              <Users className="w-8 h-8 text-blue-600" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 mb-1">Active Subscriptions</p>
                <p className="text-2xl font-bold text-green-600">{stats.activeSubscriptions}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </div>
        </div>

        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab('offers')}
            className={`px-6 py-3 rounded-lg font-medium transition-colors ${
              activeTab === 'offers'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            Service Offers
          </button>
          <button
            onClick={() => setActiveTab('subscriptions')}
            className={`px-6 py-3 rounded-lg font-medium transition-colors ${
              activeTab === 'subscriptions'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            User Subscriptions
          </button>
          <button
            onClick={() => setActiveTab('media')}
            className={`px-6 py-3 rounded-lg font-medium transition-colors ${
              activeTab === 'media'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            Media Files
          </button>
        </div>
      </div>

      {activeTab === 'offers' && (
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-slate-900">Service Offers</h2>
            <button
              onClick={() => {
                setEditingOffer(null);
                setShowModal(true);
              }}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
            >
              <Plus className="w-5 h-5" />
              Add Offer
            </button>
          </div>

          <div className="grid gap-4">
            {offers.map((offer) => (
              <div key={offer.id} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-bold text-slate-900">{offer.title}</h3>
                      {offer.service_categories && (
                        <span className="px-3 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded-full">
                          {offer.service_categories.name}
                        </span>
                      )}
                      <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                        offer.is_active ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-800'
                      }`}>
                        {offer.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <p className="text-slate-600 mb-4">{offer.description}</p>
                    <div className="flex items-center gap-6 text-sm mb-3">
                      <span className="text-slate-700">
                        <strong>Monthly:</strong> ${offer.price_monthly}
                      </span>
                      <span className="text-slate-700">
                        <strong>Yearly:</strong> ${offer.price_yearly}
                      </span>
                      {Array.isArray(offer.features) && offer.features.length > 0 && (
                        <span className="text-slate-500">{offer.features.length} features</span>
                      )}
                    </div>
                    {(offer.product_image || offer.product_link || offer.product_video) && (
                      <div className="flex items-center gap-4 text-xs text-slate-500">
                        {offer.product_image && (
                          <span className="flex items-center gap-1">
                            <ImageIcon className="w-3.5 h-3.5" />
                            Image
                          </span>
                        )}
                        {offer.product_link && (
                          <a
                            href={offer.product_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-blue-600 hover:text-blue-700"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            Link
                          </a>
                        )}
                        {offer.product_video && (
                          <button
                            onClick={() => setPlayingVideo({ url: offer.product_video!, title: offer.title })}
                            className="flex items-center gap-1 text-blue-600 hover:text-blue-700"
                          >
                            <Play className="w-3.5 h-3.5" />
                            Video
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleToggleActive(offer.id, offer.is_active)}
                      className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                      title={offer.is_active ? 'Deactivate' : 'Activate'}
                    >
                      {offer.is_active ? <XCircle className="w-5 h-5" /> : <CheckCircle className="w-5 h-5" />}
                    </button>
                    <button
                      onClick={() => {
                        setEditingOffer(offer);
                        setShowModal(true);
                      }}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      <Edit2 className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleDeleteOffer(offer.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'subscriptions' && (
        <div>
          <h2 className="text-2xl font-bold text-slate-900 mb-6">User Subscriptions</h2>
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">User</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">Service</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">Billing</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">Started</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {subscriptions.map((sub) => (
                    <tr key={sub.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="text-sm">
                          <p className="font-medium text-slate-900">{sub.profiles?.full_name}</p>
                          <p className="text-slate-500">{sub.profiles?.email}</p>
                          <p className="text-slate-500">{sub.profiles?.company_name}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-900">{sub.service_offers?.title}</td>
                      <td className="px-6 py-4">
                        <select
                          value={sub.status}
                          onChange={(e) => handleUpdateSubscriptionStatus(sub.id, e.target.value as any)}
                          className="text-sm border border-slate-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="pending">Pending</option>
                          <option value="active">Active</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-900 capitalize">{sub.billing_cycle}</td>
                      <td className="px-6 py-4 text-sm text-slate-900">{new Date(sub.started_at).toLocaleDateString()}</td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => {
                            const notes = prompt('Enter notes for this subscription:', sub.notes);
                            if (notes !== null) {
                              handleUpdateSubscriptionNotes(sub.id, notes);
                            }
                          }}
                          className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                        >
                          {sub.notes ? 'Edit Notes' : 'Add Notes'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'media' && (
        <MediaManager />
      )}

      {showModal && (
        <OfferModal
          offer={editingOffer}
          categories={categories}
          onClose={() => {
            setShowModal(false);
            setEditingOffer(null);
          }}
          onSave={async () => {
            await fetchData();
            setShowModal(false);
            setEditingOffer(null);
          }}
        />
      )}

      {playingVideo && (
        <VideoModal
          url={playingVideo.url}
          title={playingVideo.title}
          onClose={() => setPlayingVideo(null)}
        />
      )}
    </div>
  );
}
