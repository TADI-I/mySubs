import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, addDoc,writeBatch,doc,increment, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../firebase-config';


import './AddSubscription.css';

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
  },
  {
    name: "Connectivity",
    services: [
      "Telkom LTE",
      "Telkom Fibre",
      "Telkom Mobile Data"
    ]
  }
];

const servicePlans = {
  "Netflix": [
    { name: "Basic", price: 99 },
    { name: "Standard", price: 159 },
    { name: "Premium", price: 199 }
  ],
  "Showmax ": [
    { name: "Mobile", price: 39 },
    { name: "Standard", price: 99 },
    { name: "Pro", price: 225 }
  ],
  "DStv ": [
    { name: "EasyView", price: 29 },
    { name: "Access", price: 129 },
    { name: "Family", price: 319 },
    { name: "Compact", price: 449 },
    { name: "Compact Plus", price: 579 },
    { name: "Premium", price: 879 }
  ],
  "Amazon Prime Video ": [
    { name: "Standard", price: 79 }
  ],
  "Disney+ ": [
    { name: "Monthly", price: 119 },
    { name: "Annual", price: 1190 }
  ],
  "Apple TV+ ": [
    { name: "Monthly", price: 124 }
  ],
  "YouTube Premium ": [
    { name: "Individual", price: 71 },
    { name: "Family", price: 109 }
  ],
  "Spotify (Music streaming)": [
    { name: "Individual", price: 59 },
    { name: "Duo", price: 79 },
    { name: "Family", price: 99 }
  ],
  "Apple Music": [
    { name: "Individual", price: 69 },
    { name: "Family", price: 109 },
    { name: "Student", price: 34 }
  ],
  "Deezer": [
    { name: "Premium", price: 59 },
    { name: "Family", price: 89 },
    { name: "Student", price: 29 }
  ],
  "SoundCloud Go": [
    { name: "Go", price: 59 },
    { name: "Go+", price: 119 }
  ],
  "Audiobook ": [
    { name: "Standard", price: 99 }
  ],
  "PlayStation Plus ": [
    { name: "Essential", price: 119 },
    { name: "Extra", price: 179 },
    { name: "Deluxe", price: 209 }
  ],
  "Xbox Game Pass": [
    { name: "Console", price: 79 },
    { name: "PC", price: 79 },
    { name: "Ultimate", price: 119 }
  ],
  "Nintendo Switch Online": [
    { name: "Individual", price: 49 },
    { name: "Family", price: 89 }
  ],
  "Telkom LTE": [
    { name: "20GB LTE", price: 99 },
    { name: "40GB LTE", price: 149 },
    { name: "80GB LTE", price: 199 },
    { name: "120GB LTE", price: 249 }
  ],
  "Telkom Fibre": [
    { name: "25/5 Mbps", price: 399 },
    { name: "50/25 Mbps", price: 599 },
    { name: "100/50 Mbps", price: 799 }
  ],
  "Telkom Mobile Data": [
    { name: "1GB", price: 99 },
    { name: "5GB", price: 199 },
    { name: "10GB", price: 299 }
  ]
};

const serviceToCategory = {};
serviceCategories.forEach(category => {
  category.services.forEach(service => {
    // Remove trailing spaces for consistency
    serviceToCategory[service.trim()] = category.name;
  });
});

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
  const [availablePlans, setAvailablePlans] = useState([]);
  const [selectedPlan, setSelectedPlan] = useState(null);

const handleChange = (e) => {
  const { name, value } = e.target;

  if (name === "name") {
    const plans = servicePlans[value] || [];
    setAvailablePlans(plans);
    setSelectedPlan(null);

    // Auto-categorise using serviceCategories
    const autoCategory = serviceToCategory[value.trim()];
    setFormData(prev => ({
      ...prev,
      name: value,
      cost: '', // reset cost
      plan: '',
      category: autoCategory ? autoCategory : 'other'
    }));
    return;
  }

  if (name === "plan") {
    const plan = availablePlans.find(p => p.name === value);
    setSelectedPlan(plan);
    setFormData(prev => ({
      ...prev,
      plan: value,
      cost: plan ? plan.price : ''
    }));
    return;
  }

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

        {/* Show plan dropdown if available */}
        {availablePlans.length > 0 && (
          <div className="form-group">
            <label>Plan *</label>
            <select
              name="plan"
              value={formData.plan || ''}
              onChange={handleChange}
              required
            >
              <option value="">Select a plan...</option>
              {availablePlans.map(plan => (
                <option key={plan.name} value={plan.name}>
                  {plan.name} (R{plan.price})
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Show cost as read-only if plan is selected */}
        {selectedPlan && (
          <div className="form-group">
            <label>Monthly Cost</label>
            <input
              type="number"
              name="cost"
              value={selectedPlan.price}
              readOnly
            />
          </div>
        )}

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