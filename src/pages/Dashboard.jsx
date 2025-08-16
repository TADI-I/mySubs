import { useEffect, useState } from 'react';
import { auth, db } from '../firebase-config';
import { collection, query, where, onSnapshot, doc, deleteDoc } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { FiLogOut, FiPlusCircle, FiTrash2, FiEdit2 } from 'react-icons/fi';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';
import './Dashboard.css'; // Create this file for styling

ChartJS.register(ArcElement, Tooltip, Legend);

const Dashboard = () => {
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalMonthly, setTotalMonthly] = useState(0);
  const [user, setUser] = useState(null);
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
      navigate('/login');
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
      </div>
    </div>
  );
};

export default Dashboard;