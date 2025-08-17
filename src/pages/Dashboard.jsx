import { useEffect, useState } from 'react';
import { auth, db } from '../firebase-config';
import { collection, query, where, onSnapshot, doc, deleteDoc } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { FiLogOut, FiPlusCircle, FiTrash2, FiEdit2 } from 'react-icons/fi';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';
import SubscriptionsTable from '../components/SubscriptionsTable';
import './Dashboard.css'; // Create this file for styling

ChartJS.register(ArcElement, Tooltip, Legend);

const Dashboard = () => {
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalMonthly, setTotalMonthly] = useState(0);
  const [user, setUser] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const navigate = useNavigate();

  // Fetch user data and subscriptions
  useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged((currentUser) => {
      if (!currentUser) {
        navigate('/login');
      } else {
        setUser(currentUser);
        fetchSubscriptions(currentUser.uid);
      }
    });

    return () => unsubscribeAuth();
  }, [navigate]);

  // Real-time subscription data
  const fetchSubscriptions = (userId) => {
    const q = query(
      collection(db, 'users', userId, 'subscriptions'),
      where('status', '==', 'active')
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const subs = [];
      let total = 0;
      
      querySnapshot.forEach((doc) => {
        subs.push({ id: doc.id, ...doc.data() });
        total += doc.data().cost;
      });

      setSubscriptions(subs);
      setTotalMonthly(total);
      setLoading(false);
    });

    return unsubscribe;
  };

  // Handle subscription deletion
  const handleDelete = async (subId) => {
    try {
      await deleteDoc(doc(db, 'users', user.uid, 'subscriptions', subId));
    } catch (error) {
      console.error('Error deleting subscription:', error);
    }
  };

  // Logout function
  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // Chart data
  const chartData = {
    labels: subscriptions.map(sub => sub.name),
    datasets: [{
      data: subscriptions.map(sub => sub.cost),
      backgroundColor: [
        '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', 
        '#9966FF', '#FF9F40', '#8AC24A', '#607D8B'
      ],
      borderWidth: 1,
    }]
  };

  // 1. Define Service Catalog with Feature Matrix
const streamingServices = {
  'netflix': {
    tiers: [
      { name: 'Mobile', price: 99, resolution: '480p', screens: 1 },
      { name: 'Basic', price: 139, resolution: '720p', screens: 1 },
      { name: 'Standard', price: 199, resolution: '1080p', screens: 2 },
      { name: 'Premium', price: 299, resolution: '4K', screens: 4 }
    ],
    familySharing: true,
    freeTrial: true
  },
  'showmax': {
    tiers: [
      { name: 'Entertainment', price: 99, resolution: '1080p', screens: 2 },
      { name: 'Pro', price: 249, resolution: '1080p', screens: 2 } 
    ],
    bundleDiscounts: { dstv: 20 } // 20% off with DStv
  },
  // ... Add other services
};

// 2. User Profile Analysis
function analyzeUsage(user) {
  return {
    monthlyHours: user.viewingHours / 30,
    devicesUsed: user.devices.length,
    contentTypes: user.mostWatchedGenres,
    sharing: user.familyMembers > 1
  };
}

// 3. Recommendation Algorithm
function getOptimizedPlan(userSubscriptions, user) {
  const recommendations = [];
  
  userSubscriptions.forEach(sub => {
    const service = streamingServices[sub.name.toLowerCase()];
    if (!service) return;

    // Current plan analysis
    const currentTier = service.tiers.find(t => t.name === sub.plan);
    const usage = analyzeUsage(user);

    // 1. Downgrade recommendation
    const suitableTiers = service.tiers.filter(tier => (
      usage.devicesUsed <= tier.screens &&
      (usage.monthlyHours > 10 ? tier.resolution === '1080p' : true)
    ));
    const cheaperOption = suitableTiers.find(t => t.price < currentTier.price);
    if (cheaperOption) {
      recommendations.push({
        service: sub.name,
        action: 'DOWNGRADE',
        fromPlan: currentTier.name,
        toPlan: cheaperOption.name,
        monthlySavings: currentTier.price - cheaperOption.price,
        rationale: `Your usage fits ${cheaperOption.name} tier`
      });
    }

    // 2. Upgrade recommendation (simulate: if user watches a lot)
    if (usage.monthlyHours > 60 && currentTier.name !== 'Premium') {
      const premiumTier = service.tiers.find(t => t.name === 'Premium');
      if (premiumTier && premiumTier.price > currentTier.price) {
        recommendations.push({
          service: sub.name,
          action: 'UPGRADE',
          fromPlan: currentTier.name,
          toPlan: premiumTier.name,
          extraCost: premiumTier.price - currentTier.price,
          rationale: 'You watch a lot, consider Premium for best experience'
        });
      }
    }

    // 3. Cancel recommendation (simulate: if user watches very little)
    if (usage.monthlyHours < 2) {
      recommendations.push({
        service: sub.name,
        action: 'CANCEL',
        rationale: 'You barely use this service. Consider cancelling to save money.',
        monthlySavings: currentTier.price
      });
    }

    // 4. Bundle opportunities
    if (service.bundleDiscounts) {
      Object.entries(service.bundleDiscounts).forEach(([partner, discount]) => {
        if (userSubscriptions.some(s => s.name.toLowerCase() === partner)) {
          recommendations.push({
            service: sub.name,
            action: 'BUNDLE',
            withService: partner,
            discount: `${discount}% off`,
            estimatedSavings: (currentTier.price * discount / 100).toFixed(2)
          });
        }
      });
    }

    // 5. Switch recommendation (simulate: if another service is cheaper)
    Object.entries(streamingServices).forEach(([otherName, otherService]) => {
      if (otherName !== sub.name.toLowerCase()) {
        const cheapestOther = otherService.tiers.reduce((min, t) => t.price < min.price ? t : min, otherService.tiers[0]);
        if (cheapestOther.price < currentTier.price) {
          recommendations.push({
            service: sub.name,
            action: 'SWITCH',
            toService: otherName,
            toPlan: cheapestOther.name,
            monthlySavings: currentTier.price - cheapestOther.price,
            rationale: `Switch to ${otherName} for a cheaper plan`
          });
        }
      }
    });
  });

  // Simulate recommendations if none found
  if (recommendations.length === 0) {
    recommendations.push(
      {
        service: 'Showmax',
        action: 'TRY',
        rationale: 'Try Showmax for more local content.',
        estimatedSavings: 0
      },
      {
        service: 'Netflix',
        action: 'REFER',
        rationale: 'Refer a friend to Netflix and get a free month!',
        estimatedSavings: 99
      }
    );
  }

  return recommendations.sort((a, b) => (b.monthlySavings || 0) - (a.monthlySavings || 0));
}

function SavingsRecommendations() {
  const [recommendations, setRecs] = useState([]);

  useEffect(() => {
    getOptimizedPlan(userSubscriptions).then(setRecs);
  }, []);
}

  // Compute recommendations when subscriptions or user change
  useEffect(() => {
    if (user && subscriptions.length > 0) {
      // You may need to pass user profile info if required by analyzeUsage
      const userProfile = {
        viewingHours: 30, // example value
        devices: ['TV', 'Phone'],
        mostWatchedGenres: ['Drama'],
        familyMembers: 2
      };
      // Add plan info to subscriptions if needed
      const subsWithPlan = subscriptions.map(sub => ({
        ...sub,
        plan: sub.plan || 'Standard' // fallback if plan missing
      }));
      setRecommendations(getOptimizedPlan(subsWithPlan, userProfile));
    }
  }, [subscriptions, user]);

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <h1>My Subscriptions</h1>
        <div className="user-actions">
          <span>Hello, {user?.displayName || 'User'}</span>
          <button onClick={handleLogout} className="logout-btn">
            <FiLogOut /> Logout
          </button>
        </div>
      </header>

      <div className="stats-summary">
        <div className="stat-card">
          <h3>Monthly Total</h3>
          <p>ZAR- R{totalMonthly.toFixed(2)}</p>
        </div>
        <div className="stat-card">
          <h3>Active Subscriptions</h3>
          <p>{subscriptions.length}</p>
        </div>
      </div>

      <div className="content-grid">
        <section className="subscriptions-list">
          <div className="list-header">
            <h2>Your Subscriptions</h2>
            <button 
              onClick={() => navigate('/add-subscription')}
              className="add-btn"
            >
              <FiPlusCircle /> Add New
            </button>
          </div>

          {subscriptions.length === 0 ? (
            <div className="empty-state">
              <p>No subscriptions found</p>
              <button 
                onClick={() => navigate('/add-subscription')}
                className="primary-btn"
              >
                Add Your First Subscription
              </button>
            </div>
          ) : (
            <ul className="subscription-items">
              {subscriptions.map((sub) => (
                <li key={sub.id} className="subscription-item">
                  <div className="sub-info">
                    <h3>{sub.name}</h3>
                    <p>R{sub.cost} · {sub.billingCycle}</p>
                    <p>Next payment: {sub.nextPaymentDate}</p>
                  </div>
                  <div className="sub-actions">
                    <button 
                      onClick={() => navigate(`/edit-subscription/${sub.id}`)}
                      className="icon-btn"
                    >
                      <FiEdit2 />
                    </button>
                    <button 
                      onClick={() => handleDelete(sub.id)}
                      className="icon-btn danger"
                    >
                      <FiTrash2 />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="analytics-section">
          <h2>Spending Breakdown</h2>
          <div className="chart-container">
            <Doughnut data={chartData} />
          </div>
          <div className="subscription-categories">
            {subscriptions.map((sub) => (
              <div key={sub.id} className="category-tag">
                <span 
                  className="color-dot" 
                  style={{ 
                    backgroundColor: chartData.datasets[0].backgroundColor[
                      chartData.labels.indexOf(sub.name)
                    ] 
                  }} 
                />
                {sub.name}: R{sub.cost}
              </div>
            ))}
          </div>
        </section>

        <section className="analytics-section">
            <h2>Subscriptions Table</h2>    
            <SubscriptionsTable subscriptions={subscriptions} />

        </section>

        <section className="analytics-section">
          <h2>Recommendations</h2><div className="savings-card">
      <h3>Streaming Optimizer</h3>
      {recommendations.map((rec, i) => (
        <div key={i} className="recommendation">
          <div className={`action-${rec.action.toLowerCase()}`}>
            {rec.action}: {rec.service}
          </div>
          <p>Save R{rec.monthlySavings || rec.estimatedSavings}/month</p>
          <button onClick={() => applyRecommendation(rec)}>
            Apply This Change
          </button>
        </div>
      ))}
    </div>
        </section>
      </div>
    </div>
  );
};

export default Dashboard;