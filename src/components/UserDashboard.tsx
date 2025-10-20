import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Calendar, DollarSign, CheckCircle, Clock, XCircle, Package, ExternalLink, Image, Video, Play } from 'lucide-react';
import type { Database } from '../lib/database.types';
import { VideoModal } from './VideoModal';

type ServiceOffer = Database['public']['Tables']['service_offers']['Row'];
type UserSubscription = Database['public']['Tables']['user_subscriptions']['Row'] & {
  service_offers: ServiceOffer | null;
};
type Category = Database['public']['Tables']['service_categories']['Row'];

export function UserDashboard() {
  const { profile } = useAuth();
  const [subscriptions, setSubscriptions] = useState<UserSubscription[]>([]);
  const [availableOffers, setAvailableOffers] = useState<(ServiceOffer & { service_categories: Category | null })[]>([]);
  const [loading, setLoading] = useState(true);
  const [subscribing, setSubscribing] = useState<string | null>(null);
  const [playingVideo, setPlayingVideo] = useState<{ url: string; title: string } | null>(null);

  useEffect(() => {
    fetchData();
  }, [profile]);

  const fetchData = async () => {
    if (!profile) return;

    const [subsResult, offersResult] = await Promise.all([
      supabase
        .from('user_subscriptions')
        .select('*, service_offers(*)')
        .eq('user_id', profile.id),
      supabase
        .from('service_offers')
        .select('*, service_categories(*)')
        .eq('is_active', true),
    ]);

    if (subsResult.data) {
      setSubscriptions(subsResult.data as UserSubscription[]);
    }

    if (offersResult.data) {
      const subscribedOfferIds = subsResult.data?.map((s) => s.offer_id) || [];
      const available = offersResult.data.filter(
        (offer) => !subscribedOfferIds.includes(offer.id)
      );
      setAvailableOffers(available as (ServiceOffer & { service_categories: Category | null })[]);
    }

    setLoading(false);
  };

  const handleSubscribe = async (offerId: string, billingCycle: 'monthly' | 'yearly') => {
    if (!profile) return;
    setSubscribing(offerId);

    const { error } = await supabase.from('user_subscriptions').insert({
      user_id: profile.id,
      offer_id: offerId,
      billing_cycle: billingCycle,
      status: 'pending',
    });

    if (!error) {
      await fetchData();
    }

    setSubscribing(null);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'pending':
        return <Clock className="w-5 h-5 text-amber-600" />;
      case 'cancelled':
        return <XCircle className="w-5 h-5 text-red-600" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    const classes = {
      active: 'bg-green-100 text-green-800',
      pending: 'bg-amber-100 text-amber-800',
      cancelled: 'bg-red-100 text-red-800',
    };

    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${classes[status as keyof typeof classes]}`}>
        {getStatusIcon(status)}
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
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
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Welcome back, {profile?.full_name}!</h1>
        <p className="text-slate-600">{profile?.company_name}</p>
      </div>

      <div className="mb-12">
        <h2 className="text-2xl font-bold text-slate-900 mb-6">Your Services</h2>
        {subscriptions.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 text-center">
            <Package className="w-12 h-12 text-slate-400 mx-auto mb-3" />
            <p className="text-slate-600">You don't have any active services yet.</p>
            <p className="text-sm text-slate-500 mt-1">Browse available services below to get started.</p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {subscriptions.map((sub) => (
              <div key={sub.id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-shadow">
                {sub.service_offers?.product_image && (
                  <div className="h-48 w-full overflow-hidden bg-slate-100">
                    <img
                      src={sub.service_offers.product_image}
                      alt={sub.service_offers.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="text-lg font-semibold text-slate-900">{sub.service_offers?.title}</h3>
                    {getStatusBadge(sub.status)}
                  </div>
                  <p className="text-slate-600 text-sm mb-4 line-clamp-2">{sub.service_offers?.description}</p>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-slate-600">
                    <DollarSign className="w-4 h-4" />
                    <span>
                      ${sub.billing_cycle === 'monthly' ? sub.service_offers?.price_monthly : sub.service_offers?.price_yearly} / {sub.billing_cycle}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-600">
                    <Calendar className="w-4 h-4" />
                    <span>Started {new Date(sub.started_at).toLocaleDateString()}</span>
                  </div>
                </div>
                  {(sub.service_offers?.product_link || sub.service_offers?.product_video) && (
                    <div className="flex gap-2 mt-4">
                      {sub.service_offers?.product_link && (
                        <a
                          href={sub.service_offers.product_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 font-medium"
                        >
                          <ExternalLink className="w-4 h-4" />
                          View Product
                        </a>
                      )}
                      {sub.service_offers?.product_video && (
                        <button
                          onClick={() => setPlayingVideo({ url: sub.service_offers!.product_video!, title: sub.service_offers!.title })}
                          className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 font-medium"
                        >
                          <Play className="w-4 h-4" />
                          Watch Video
                        </button>
                      )}
                    </div>
                  )}
                  {sub.notes && (
                    <div className="mt-4 pt-4 border-t border-slate-200">
                      <p className="text-xs text-slate-500 font-medium mb-1">Admin Notes:</p>
                      <p className="text-sm text-slate-600">{sub.notes}</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <h2 className="text-2xl font-bold text-slate-900 mb-6">Available Services</h2>
        {availableOffers.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 text-center">
            <p className="text-slate-600">No new services available at this time.</p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {availableOffers.map((offer) => (
              <div key={offer.id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-lg transition-all">
                {offer.product_image && (
                  <div className="h-48 w-full overflow-hidden bg-slate-100">
                    <img
                      src={offer.product_image}
                      alt={offer.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <div className="p-6">
                  <div className="mb-4">
                    {offer.service_categories && (
                      <span className="inline-block px-3 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded-full mb-3">
                        {offer.service_categories.name}
                      </span>
                    )}
                    <h3 className="text-xl font-bold text-slate-900 mb-2">{offer.title}</h3>
                    <p className="text-slate-600 text-sm">{offer.description}</p>
                  </div>

                  {Array.isArray(offer.features) && offer.features.length > 0 && (
                    <ul className="space-y-2 mb-4">
                      {offer.features.map((feature, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm text-slate-700">
                          <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  )}

                  {(offer.product_link || offer.product_video) && (
                    <div className="flex gap-3 mb-4 pb-4 border-b border-slate-200">
                      {offer.product_link && (
                        <a
                          href={offer.product_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 font-medium"
                        >
                          <ExternalLink className="w-4 h-4" />
                          Learn More
                        </a>
                      )}
                      {offer.product_video && (
                        <button
                          onClick={() => setPlayingVideo({ url: offer.product_video!, title: offer.title })}
                          className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 font-medium"
                        >
                          <Play className="w-4 h-4" />
                          Watch Demo
                        </button>
                      )}
                    </div>
                  )}

                  <div className="space-y-3 pt-4 border-t border-slate-200">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-600">Monthly</span>
                      <span className="text-lg font-bold text-slate-900">${offer.price_monthly}</span>
                    </div>
                    <button
                      onClick={() => handleSubscribe(offer.id, 'monthly')}
                      disabled={subscribing === offer.id}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors disabled:opacity-50"
                    >
                      {subscribing === offer.id ? 'Subscribing...' : 'Subscribe Monthly'}
                    </button>

                    {offer.price_yearly > 0 && (
                      <>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-slate-600">Yearly</span>
                          <span className="text-lg font-bold text-slate-900">${offer.price_yearly}</span>
                        </div>
                        <button
                          onClick={() => handleSubscribe(offer.id, 'yearly')}
                          disabled={subscribing === offer.id}
                          className="w-full bg-slate-600 hover:bg-slate-700 text-white font-medium py-2 px-4 rounded-lg transition-colors disabled:opacity-50"
                        >
                          {subscribing === offer.id ? 'Subscribing...' : 'Subscribe Yearly'}
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

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
