import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { Edit, Save, X } from 'lucide-react';
import PropTypes from 'prop-types';
import toast from 'react-hot-toast';

const ProfileEditor = ({ userProfile, onProfileUpdate, userId }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const { register, handleSubmit, reset, formState: { errors, isDirty } } = useForm();

  // Reset form when userProfile changes
  useEffect(() => {
    if (userProfile) {
      reset({
        displayName: userProfile.displayName || '',
        height: userProfile.height || '',
        currentWeight: userProfile.currentWeight || '',
        targetWeight: userProfile.targetWeight || '',
        age: userProfile.age || '',
        gender: userProfile.gender || '',
        activityLevel: userProfile.activityLevel || '',
        waterGoal: userProfile.waterGoal || 4000,
        calorieGoal: userProfile.calorieGoal || '',
        proteinGoal: userProfile.proteinGoal || '',
        carbGoal: userProfile.carbGoal || '',
        fatGoal: userProfile.fatGoal || ''
      });
    }
  }, [userProfile, reset]);

  const onSubmit = async (data) => {
    setIsLoading(true);
    try {
      const profileRef = doc(db, 'users', userId, 'profile', 'data');
      
      const profileData = {
        ...userProfile, // Keep existing data like email, photoURL, etc.
        ...data,
        height: parseFloat(data.height) || null,
        currentWeight: parseFloat(data.currentWeight) || null,
        targetWeight: parseFloat(data.targetWeight) || null,
        age: parseInt(data.age) || null,
        waterGoal: parseInt(data.waterGoal) || 4000,
        calorieGoal: parseInt(data.calorieGoal) || null,
        proteinGoal: parseInt(data.proteinGoal) || null,
        carbGoal: parseInt(data.carbGoal) || null,
        fatGoal: parseInt(data.fatGoal) || null,
        updatedAt: new Date().toISOString()
      };

      // Use setDoc to create or update the document
      await setDoc(profileRef, profileData, { merge: true });
      
      toast.success('Profile updated successfully!');
      setIsEditing(false);
      
      // Refresh the profile data
      if (onProfileUpdate) {
        onProfileUpdate();
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    reset();
    setIsEditing(false);
  };

  const activityLevels = [
    { value: 'sedentary', label: 'Sedentary (little or no exercise)' },
    { value: 'light', label: 'Lightly active (light exercise 1-3 days/week)' },
    { value: 'moderate', label: 'Moderately active (moderate exercise 3-5 days/week)' },
    { value: 'very', label: 'Very active (hard exercise 6-7 days/week)' },
    { value: 'extra', label: 'Extra active (very hard exercise, physical job)' }
  ];

  if (!userProfile) {
    return (
      <div className="card max-w-2xl">
        <div className="animate-pulse">
          <div className="h-20 w-20 bg-gray-300 rounded-full mb-4"></div>
          <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
          <div className="h-4 bg-gray-300 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <div className="card max-w-4xl">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 space-y-4 sm:space-y-0">
          <div className="flex items-center space-x-4">
            <img
              src={
                userProfile?.photoURL || 
                `https://ui-avatars.com/api/?name=${encodeURIComponent(userProfile?.displayName || 'User')}&background=3b82f6&color=fff&size=80`
              }
              alt="Profile"
              className="h-20 w-20 rounded-full"
              onError={(e) => {
                e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(userProfile?.displayName || 'User')}&background=6366f1&color=fff&size=80`;
              }}
            />
            <div>
              <h3 className="text-xl font-semibold">{userProfile?.displayName}</h3>
              <p className="text-gray-600">{userProfile?.email}</p>
              <p className="text-sm text-gray-500 mt-1">
                Profile photo via {userProfile?.photoURL ? 'Google' : 'UI Avatars'}
              </p>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 w-full sm:w-auto">
            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                className="btn-primary flex items-center justify-center text-sm sm:text-base px-3 py-2 sm:px-4 sm:py-2"
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit Profile
              </button>
            ) : (
              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                <button
                  type="submit"
                  form="profile-form"
                  disabled={isLoading || !isDirty}
                  className="btn-primary flex items-center justify-center disabled:opacity-50 text-sm sm:text-base px-3 py-2 sm:px-4 sm:py-2"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {isLoading ? 'Saving...' : 'Save'}
                </button>
                <button
                  onClick={handleCancel}
                  disabled={isLoading}
                  className="btn-secondary flex items-center justify-center text-sm sm:text-base px-3 py-2 sm:px-4 sm:py-2"
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Profile Form */}
        <form id="profile-form" onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Basic Information */}
          <div>
            <h4 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Display Name
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    className="input-field"
                    {...register('displayName', { required: 'Display name is required' })}
                  />
                ) : (
                  <p className="text-lg py-2">{userProfile?.displayName || 'Not set'}</p>
                )}
                {errors.displayName && (
                  <p className="mt-1 text-sm text-red-600">{errors.displayName.message}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Age
                </label>
                {isEditing ? (
                  <input
                    type="number"
                    min="13"
                    max="120"
                    className="input-field"
                    {...register('age', { 
                      min: { value: 13, message: 'Age must be at least 13' },
                      max: { value: 120, message: 'Age must be less than 120' }
                    })}
                  />
                ) : (
                  <p className="text-lg py-2">{userProfile?.age || 'Not set'}</p>
                )}
                {errors.age && (
                  <p className="mt-1 text-sm text-red-600">{errors.age.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Gender
                </label>
                {isEditing ? (
                  <select className="input-field" {...register('gender')}>
                    <option value="">Select gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                ) : (
                  <p className="text-lg py-2 capitalize">{userProfile?.gender || 'Not set'}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Activity Level
                </label>
                {isEditing ? (
                  <select className="input-field" {...register('activityLevel')}>
                    <option value="">Select activity level</option>
                    {activityLevels.map((level) => (
                      <option key={level.value} value={level.value}>
                        {level.label}
                      </option>
                    ))}
                  </select>
                ) : (
                  <p className="text-lg py-2">
                    {activityLevels.find(l => l.value === userProfile?.activityLevel)?.label || 'Not set'}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Physical Stats */}
          <div>
            <h4 className="text-lg font-semibold text-gray-900 mb-4">Physical Stats</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Height (cm)
                </label>
                {isEditing ? (
                  <input
                    type="number"
                    min="100"
                    max="250"
                    step="0.1"
                    className="input-field"
                    {...register('height', {
                      min: { value: 100, message: 'Height must be at least 100cm' },
                      max: { value: 250, message: 'Height must be less than 250cm' }
                    })}
                  />
                ) : (
                  <p className="text-lg py-2">{userProfile?.height ? `${userProfile.height} cm` : 'Not set'}</p>
                )}
                {errors.height && (
                  <p className="mt-1 text-sm text-red-600">{errors.height.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Current Weight (kg)
                </label>
                {isEditing ? (
                  <input
                    type="number"
                    min="30"
                    max="300"
                    step="0.1"
                    className="input-field"
                    {...register('currentWeight', {
                      min: { value: 30, message: 'Weight must be at least 30kg' },
                      max: { value: 300, message: 'Weight must be less than 300kg' }
                    })}
                  />
                ) : (
                  <p className="text-lg py-2">{userProfile?.currentWeight ? `${userProfile.currentWeight} kg` : 'Not set'}</p>
                )}
                {errors.currentWeight && (
                  <p className="mt-1 text-sm text-red-600">{errors.currentWeight.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Target Weight (kg)
                </label>
                {isEditing ? (
                  <input
                    type="number"
                    min="30"
                    max="300"
                    step="0.1"
                    className="input-field"
                    {...register('targetWeight', {
                      min: { value: 30, message: 'Weight must be at least 30kg' },
                      max: { value: 300, message: 'Weight must be less than 300kg' }
                    })}
                  />
                ) : (
                  <p className="text-lg py-2">{userProfile?.targetWeight ? `${userProfile.targetWeight} kg` : 'Not set'}</p>
                )}
                {errors.targetWeight && (
                  <p className="mt-1 text-sm text-red-600">{errors.targetWeight.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* Goals */}
          <div>
            <h4 className="text-lg font-semibold text-gray-900 mb-4">Daily Goals</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Water (ml)
                </label>
                {isEditing ? (
                  <input
                    type="number"
                    min="1000"
                    max="8000"
                    className="input-field"
                    {...register('waterGoal', {
                      min: { value: 1000, message: 'Water goal must be at least 1000ml' },
                      max: { value: 8000, message: 'Water goal must be less than 8000ml' }
                    })}
                  />
                ) : (
                  <p className="text-lg py-2">{userProfile?.waterGoal || 4000} ml</p>
                )}
                {errors.waterGoal && (
                  <p className="mt-1 text-sm text-red-600">{errors.waterGoal.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Calories
                </label>
                {isEditing ? (
                  <input
                    type="number"
                    min="1000"
                    max="5000"
                    className="input-field"
                    {...register('calorieGoal', {
                      min: { value: 1000, message: 'Calorie goal must be at least 1000' },
                      max: { value: 5000, message: 'Calorie goal must be less than 5000' }
                    })}
                  />
                ) : (
                  <p className="text-lg py-2">{userProfile?.calorieGoal || 'Not set'}</p>
                )}
                {errors.calorieGoal && (
                  <p className="mt-1 text-sm text-red-600">{errors.calorieGoal.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Protein (g)
                </label>
                {isEditing ? (
                  <input
                    type="number"
                    min="50"
                    max="300"
                    className="input-field"
                    {...register('proteinGoal', {
                      min: { value: 50, message: 'Protein goal must be at least 50g' },
                      max: { value: 300, message: 'Protein goal must be less than 300g' }
                    })}
                  />
                ) : (
                  <p className="text-lg py-2">{userProfile?.proteinGoal ? `${userProfile.proteinGoal}g` : 'Not set'}</p>
                )}
                {errors.proteinGoal && (
                  <p className="mt-1 text-sm text-red-600">{errors.proteinGoal.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Carbs (g)
                </label>
                {isEditing ? (
                  <input
                    type="number"
                    min="50"
                    max="500"
                    className="input-field"
                    {...register('carbGoal', {
                      min: { value: 50, message: 'Carb goal must be at least 50g' },
                      max: { value: 500, message: 'Carb goal must be less than 500g' }
                    })}
                  />
                ) : (
                  <p className="text-lg py-2">{userProfile?.carbGoal ? `${userProfile.carbGoal}g` : 'Not set'}</p>
                )}
                {errors.carbGoal && (
                  <p className="mt-1 text-sm text-red-600">{errors.carbGoal.message}</p>
                )}
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

ProfileEditor.propTypes = {
  userProfile: PropTypes.object,
  onProfileUpdate: PropTypes.func.isRequired,
  userId: PropTypes.string.isRequired
};

export default ProfileEditor; 