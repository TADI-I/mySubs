import { useState, useEffect } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase-config';
//import './EditSubscriptionModal.css';

const EditSubscriptionModal = ({ subscription, onClose, onUpdate }) => {
  const [formData, setFormData] = useState({
    name: '',
    cost: '',
    billingCycle: 'monthly',
    category: 'music',
    nextPaymentDate: '',
    notes: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Initialize form with subscription data
  useEffect(() => {
    if (subscription) {
      setFormData({
        name: subscription.name || '',
        cost: subscription.cost || '',
        billingCycle: subscription.billingCycle || 'monthly',
        category: subscription.category || 'music',
        nextPaymentDate: subscription.nextPaymentDate || '',
        notes: subscription.notes || ''
      });
    }
  }, [subscription]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'cost' ? parseFloat(value) || 0 : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (!subscription?.id) throw new Error('Invalid subscription');
      
      const subRef = doc(db, 'users', auth.currentUser.uid, 'subscriptions', subscription.id);
      
      await updateDoc(subRef, {
        ...formData,
        lastUpdated: serverTimestamp()
      });

      onUpdate(); // Refresh parent component
      onClose(); // Close modal
    } catch (err) {
      setError(err.message);
      console.error("Update error:", err);
    } finally {
      setLoading(false);
    }
  };

  if (!subscription) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <button className="close-button" onClick={onClose}>×</button>
        <h2>Edit Subscription</h2>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Service Name</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Cost</label>
              <input
                type="number"
                name="cost"
                value={formData.cost}
                onChange={handleChange}
                min="0.01"
                step="0.01"
                required
              />
            </div>

            <div className="form-group">
              <label>Billing Cycle</label>
              <select
                name="billingCycle"
                value={formData.billingCycle}
                onChange={handleChange}
                required
              >
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
              </select>
            </div>
          </div>

          {/* Add other fields similarly */}

          {error && <div className="error-message">{error}</div>}

          <div className="modal-actions">
            <button type="button" onClick={onClose} disabled={loading}>
              Cancel
            </button>
            <button type="submit" disabled={loading}>
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditSubscriptionModal;