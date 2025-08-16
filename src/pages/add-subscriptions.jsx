import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, addDoc,writeBatch,doc,increment, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../firebase-config';


//import './AddSubscription.css';

    const CATEGORIES = [
        { value: 'video', label: 'Video' },
        { value: 'music', label: 'Music' },
        { value: 'gaming', label: 'Gaming' }
      ];    
      
      const serviceCategories = [
  {
    name: "Streaming & Entertainment",
    services: [
      "DStv ",
      "Showmax ",
      "Netflix ",
      "Amazon Prime Video ",
      "Disney+ ",
      "Apple TV+ ",
      "YouTube Premium "
    ]
  },
  {
    name: "Music & Audio",
    services: [
      "Spotify (Music streaming)",
      "Apple Music",
      "Deezer",
      "SoundCloud Go",
      "Audiobook "
    ]
  },
  {
    name: "Gaming",
    services: [
      "PlayStation Plus ",
      "Xbox Game Pass",
      "Nintendo Switch Online"
    ]
  }
];

const AddSubscription = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    cost: '',
    billingCycle: 'monthly',
    category: 'other',
    nextPaymentDate: '',
    notes: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

const handleChange = (e) => {
  const { name, value, type, checked } = e.target;
  
  // Special handling for different input types
  let processedValue;
  
  switch (name) {
    case 'cost':
      // Ensure cost is a positive number with 2 decimal places
      processedValue = parseFloat(value) || 0;
      if (processedValue < 0) processedValue = 0;
      processedValue = parseFloat(processedValue.toFixed(2));
      break;
      
    case 'billingCycle':
      // Validate billing cycle options
      processedValue = ['monthly', 'yearly', 'weekly'].includes(value) 
        ? value 
        : 'monthly';
      break;
      
    case 'category':
      // Validate against allowed categories
      processedValue = ['music', 'video', 'other'].includes(value)
        ? value
        : 'other';
      break;
      
    case 'nextPaymentDate':
      // Basic date validation (you could add more robust checks)
      processedValue = value || '';
      break;
      
    default:
      processedValue = value;
  }

  console.log(`Field changed: ${name}`, {
    rawValue: value,
    processedValue
  });

  setFormData(prev => ({
    ...prev,
    [name]: processedValue
  }));
};

const handleSubmit = async (e) => {
  e.preventDefault();
  setError('');
  setLoading(true);

  try {
    // Validate required fields
    if (!formData.name || !formData.cost || !formData.nextPaymentDate) {
      throw new Error('Please fill all required fields');
    }

    // Validate cost is positive number
    const costValue = parseFloat(formData.cost);
    if (isNaN(costValue) || costValue <= 0) {
      throw new Error('Please enter a valid cost amount');
    }

    const userId = auth.currentUser.uid;
    const monthlyValue = formData.billingCycle === 'monthly' 
      ? costValue 
      : costValue / 12;

    // Create subscription document
    const subscriptionData = {
      name: formData.name.trim(),
      cost: costValue,
      billingCycle: formData.billingCycle,
      category: formData.category || 'other', // Default to 'other' if undefined
      nextPaymentDate: formData.nextPaymentDate,
      notes: formData.notes.trim(),
      status: 'active',
      createdAt: serverTimestamp(),
      lastUpdated: serverTimestamp()
    };

    // Execute both operations as a batch (atomic update)
    const batch = writeBatch(db);
    
    // 1. Add new subscription
    const subsRef = doc(collection(db, 'users', userId, 'subscriptions'));
    batch.set(subsRef, subscriptionData);
    
    // 2. Update user's summary
    const userRef = doc(db, 'users', userId);
    batch.update(userRef, {
      subscriptionCount: increment(1),
      totalMonthlySpend: increment(monthlyValue)
    });
    
    await batch.commit();

    navigate('/dashboard');
  } catch (err) {
    setError(err.message);
    console.error("Subscription creation error:", err);
  } finally {
    setLoading(false);
  }
};

  return (
    <div className="add-subscription-container">
      <h2>Add New Subscription</h2>
      
      <form onSubmit={handleSubmit}>
    <div className="form-group">
        <label>Service Name *</label>
        <select
          name="name"
          value={formData.name}
          onChange={handleChange}
          required
          className="service-dropdown"
        >
          <option value="">Select a service...</option>
          
          {serviceCategories.map((category) => (
            <optgroup key={category.name} label={category.name}>
              {category.services.map((service) => (
                <option key={service} value={service}>
                  {service}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Monthly Cost *</label>
            <input
              type="number"
              name="cost"
              value={formData.cost}
              onChange={handleChange}
              min="0.01"
              step="0.01"
              required
              placeholder="9.99"
            />
          </div>

          <div className="form-group">
            <label>Billing Cycle *</label>
            <select
              name="billingCycle"
              value={formData.billingCycle}
              onChange={handleChange}
              required
            >
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
              <option value="weekly">Weekly</option>
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Next Payment Date *</label>
            <input
              type="date"
              name="nextPaymentDate"
              value={formData.nextPaymentDate}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Category</label>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
            >
              {CATEGORIES.map(cat => (
                <option key={cat.value} value={cat.value}>{cat.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="form-group">
          <label>Notes</label>
          <textarea
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            placeholder="Account details, plan type, etc."
            rows="3"
          />
        </div>

        {error && <div className="error-message">{error}</div>}

        <div className="form-actions">
          <button 
            type="button" 
            className="secondary"
            onClick={() => navigate('/dashboard')}
            disabled={loading}
          >
            Cancel
          </button>
          <button 
            type="submit" 
            disabled={loading}
          >
            {loading ? 'Adding...' : 'Add Subscription'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddSubscription;