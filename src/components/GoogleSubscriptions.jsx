import React, { useState, useEffect } from 'react';
import { useGoogleLogin } from '@react-oauth/google';

const GoogleSubscriptions = () => {
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchSubscriptions = async (token) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/google-subscriptions?token=${token}`);
      const data = await response.json();
      setSubscriptions(data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const login = useGoogleLogin({
    scope: 'https://www.googleapis.com/auth/payments.readonly',
    onSuccess: (tokenResponse) => {
      fetchSubscriptions(tokenResponse.access_token);
    },
    onError: () => {
      console.log('Login Failed');
    }
  });

  return (
    <div>
      <h2>Google Subscriptions</h2>
      <button onClick={() => login()}>
        {loading ? 'Loading...' : 'Import Google Subscriptions'}
      </button>

      {subscriptions.length > 0 && (
        <ul className="subscription-list">
          {subscriptions.map((sub) => (
            <li key={sub.id} className={`subscription-item status-${sub.status.toLowerCase()}`}>
              <div className="sub-info">
                <h3>{sub.name}</h3>
                <p>{sub.price} {sub.currency} · {sub.billingCycle}</p>
                <p>Next payment: {new Date(sub.nextPaymentDate).toLocaleDateString()}</p>
                <span className="status-badge">{sub.status}</span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default GoogleSubscriptions;