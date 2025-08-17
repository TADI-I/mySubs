import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db, auth } from '../firebase-config';
import './SubscriptionsTable.css';

const SubscriptionsTable = () => {
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const userId = auth.currentUser?.uid;
    if (!userId) return;

    const q = query(collection(db, 'users', userId, 'subscriptions'));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const subs = [];
      querySnapshot.forEach((doc) => {
        subs.push({ id: doc.id, ...doc.data() });
      });

      // If no subscriptions, add a hard-coded cancelled one for demo
      if (subs.length === 0) {
        subs.push({
          id: 'demo-cancelled',
          name: 'Netflix',
          cost: 199,
          billingCycle: 'Monthly',
          nextPaymentDate: '2025-09-01',
          status: 'cancelled'
        },
     {
            id: 'demo-overdue',
            name: 'Spotify',
            cost: 59,
            billingCycle: 'Monthly',
            nextPaymentDate: '2025-07-01', // Past date to show overdue
            status: 'pending'
          });
      }

      setSubscriptions(subs);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const getSubscriptionStatus = (sub) => {
    const today = new Date();
    const paymentDate = new Date(sub.nextPaymentDate);
    const fiveDaysBefore = new Date(paymentDate);
    fiveDaysBefore.setDate(paymentDate.getDate() - 5);
    const fiveDaysAfter = new Date(paymentDate);
    fiveDaysAfter.setDate(paymentDate.getDate() + 5);

    if (sub.status === 'cancelled') return 'inactive';
    if (sub.status === 'pending') return 'paused';
    if (today >= fiveDaysBefore && today <= fiveDaysAfter) return 'warning';
    return 'active';
  };

  const handlePaymentRedirect = (serviceName) => {
    // Map services to their payment URLs
const paymentUrls = {
  // Streaming & Entertainment
  'dstv': 'https://www.dstv.com/account/payment',
  'showmax': 'https://www.showmax.com/account/payment',
  'netflix': 'https://www.netflix.com/youraccount',
  'amazon prime video': 'https://www.amazon.com/gp/css/account/homepage',
  'disney+': 'https://www.disneyplus.com/account',
  'apple tv+': 'https://tv.apple.com/account',
  'youtube premium': 'https://www.youtube.com/paid_memberships',

  // Music & Audio
  'spotify': 'https://www.spotify.com/account/subscription',
  'apple music': 'https://music.apple.com/account',
  'deezer': 'https://www.deezer.com/account/subscription',
  'soundcloud go': 'https://soundcloud.com/settings/subscription',
  'audible': 'https://www.audible.com/member',

  // Gaming
  'playstation plus': 'https://store.playstation.com/en-us/subscriptions',
  'xbox game pass': 'https://account.microsoft.com/services',
  'nintendo switch online': 'https://accounts.nintendo.com/subscriptions'
};

    const serviceKey = serviceName.toLowerCase().split(' ')[0];
    const url = paymentUrls[serviceKey] || '#';
    window.open(url, '_blank');
  };

  if (loading) return <div className="loading">Loading subscriptions...</div>;

  return (
    <div className="subscriptions-table-container">
      <table className="subscriptions-table">
        <thead>
          <tr>
            <th>Service</th>
            <th>Cost</th>
            <th>Next Payment</th>
            <th>Status</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {subscriptions.map((sub) => {
            const status = getSubscriptionStatus(sub);
            const statusClass = `status-${status}`;
            const needsAction = ['warning', 'paused'].includes(status);

            return (
              <tr key={sub.id} className={statusClass}>
                <td>{sub.name}</td>
                <td>R{sub.cost} ({sub.billingCycle})</td>
                <td>{sub.nextPaymentDate}</td>
                <td>
                  <span className="status-badge">
                    {status === 'active' && 'Active'}
                    {status === 'warning' && 'Payment Due'}
                    {status === 'paused' && 'Awaiting Payment'}
                    {status === 'inactive' && 'Cancelled'}
                  </span>
                </td>
                <td>
                  {needsAction && (
                    <button 
                      onClick={() => handlePaymentRedirect(sub.name)}
                      className="payment-button"
                    >
                      Make Payment
                    </button>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default SubscriptionsTable;