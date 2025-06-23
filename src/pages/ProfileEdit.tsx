
import React, { useState, useEffect } from 'react';
import { ArrowLeft, Camera, User, Phone, Mail, CreditCard, Save, X, Upload, Check } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import toastService from "@/services/toastService";
import AppLayout from '@/components/AppLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useUserDetails } from '@/hooks/useUserDetails';
import { userService } from '@/services/userService';
import { ImageKitService } from '@/utils/imagekit';

const ProfileEdit = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: userData, isLoading } = useUserDetails(user?.id);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>('');
  
  // Form state
  const [formData, setFormData] = useState({
    fullName: '',
    phoneNumber: '',
    email: '',
    address: '',
    city: '',
    country: 'Pakistan',
    profileImageUrl: ''
  });

  // Update form data when user data is loaded
  useEffect(() => {
    if (userData) {
      setFormData({
        fullName: userData.full_name || '',
        phoneNumber: userData.phone_number || '',
        email: userData.email || '',
        address: userData.address || '',
        city: userData.city || '',
        country: userData.country || 'Pakistan',
        profileImageUrl: userData.profile_image_url || ''
      });
    }
  }, [userData]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handlePhotoSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toastService.error('Please select a valid image file');
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toastService.error('Image size should be less than 5MB');
        return;
      }

      setSelectedPhoto(file);
      const previewUrl = URL.createObjectURL(file);
      setPhotoPreview(previewUrl);
      toastService.success('Photo selected! Click Save Changes to update.');
    }
  };

  const handleSaveProfile = async () => {
    if (!user?.id) {
      toastService.error("User not authenticated");
      return;
    }

    setIsUpdating(true);
    
    try {
      let updatedProfileImageUrl = formData.profileImageUrl;

      // Upload new photo if selected
      if (selectedPhoto) {
        setIsUploadingPhoto(true);
        try {
          updatedProfileImageUrl = await ImageKitService.uploadImage(selectedPhoto, 'profiles');
          toastService.success('Profile photo uploaded successfully!');
        } catch (error) {
          console.error('Photo upload failed:', error);
          toastService.error('Failed to upload photo. Saving other changes...');
          // Continue with other updates even if photo upload fails
        } finally {
          setIsUploadingPhoto(false);
        }
      }

      // Update user profile
      await userService.updateUserProfile(user.id, {
        full_name: formData.fullName,
        email: formData.email,
        address: formData.address,
        city: formData.city,
        country: formData.country,
        profile_image_url: updatedProfileImageUrl
      });

      toastService.success("Your profile has been successfully updated.");
      
      // Clean up photo selection
      if (selectedPhoto) {
        setSelectedPhoto(null);
        setPhotoPreview('');
        URL.revokeObjectURL(photoPreview);
      }
      
      navigate('/my-account');
    } catch (error) {
      console.error('Error updating profile:', error);
      toastService.error("Failed to update profile. Please try again.");
    } finally {
      setIsUpdating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <AppLayout showHeader={false} showBottomNav={false}>
          <div className="flex items-center justify-center min-h-screen">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
          </div>
        </AppLayout>
      </div>
    );
  }

  const displayImageUrl = photoPreview || formData.profileImageUrl || "/lovable-uploads/ecb13db3-ef6b-460e-bcad-5ce0e5bd11dd.png";

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <AppLayout showHeader={false} showBottomNav={false}>
        {/* Compact Header */}
        <div className="relative bg-gradient-to-br from-emerald-500 via-green-500 to-teal-600 pt-safe pb-6 px-3 overflow-hidden">
          {/* Background effects */}
          <div className="absolute inset-0 bg-gradient-to-r from-white/5 via-white/10 to-white/5"></div>
          <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -translate-y-6 translate-x-6 blur-sm"></div>
          <div className="absolute bottom-0 left-0 w-20 h-20 bg-white/10 rounded-full translate-y-6 -translate-x-6 blur-sm"></div>
          
          <div className="relative z-10 max-w-md mx-auto">
            {/* Header navigation */}
            <div className="flex items-center justify-between mb-4 py-1">
              <Link 
                to="/my-account" 
                className="p-2 rounded-xl bg-white/15 hover:bg-white/25 transition-all duration-300 backdrop-blur-md border border-white/20 shadow-lg hover:shadow-xl hover:scale-105 active:scale-95"
              >
                <ArrowLeft size={18} className="text-white" />
              </Link>
              
              <div className="text-center">
                <h1 className="text-lg font-bold text-white mb-0.5 tracking-wide">Edit Profile</h1>
                <p className="text-white/80 text-sm">Update your information</p>
              </div>
              
              <Button 
                onClick={handleSaveProfile}
                disabled={isUpdating || isUploadingPhoto}
                size="sm" 
                className="bg-white/15 hover:bg-white/25 text-white px-3 py-1.5 h-auto text-sm backdrop-blur-md border border-white/20 font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 active:scale-95 disabled:opacity-50"
              >
                <Save size={12} className="mr-1" />
                {isUpdating ? 'Saving...' : 'Save'}
              </Button>
            </div>

            {/* Profile Photo Section */}
            <div className="flex flex-col items-center">
              <div className="relative group mb-3">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-white/20 to-white/10 backdrop-blur-md p-1 shadow-2xl border border-white/30">
                  <Avatar className="w-full h-full rounded-xl">
                    <AvatarImage 
                      src={displayImageUrl} 
                      alt="Profile" 
                      className="rounded-xl object-cover" 
                    />
                    <AvatarFallback className="bg-white/20 text-white text-base font-bold rounded-xl backdrop-blur-sm">
                      {formData.fullName.split(' ').map(n => n[0]).join('').slice(0, 2) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoSelect}
                  className="hidden"
                  id="photo-upload"
                  disabled={isUploadingPhoto}
                />
                <Button 
                  size="icon" 
                  onClick={() => document.getElementById('photo-upload')?.click()}
                  disabled={isUploadingPhoto}
                  className="absolute -bottom-1 -right-1 w-7 h-7 rounded-xl bg-white text-green-600 hover:bg-gray-50 shadow-xl border-2 border-white group-hover:scale-110 transition-all duration-200 disabled:opacity-50"
                >
                  {isUploadingPhoto ? (
                    <div className="animate-spin rounded-full h-3 w-3 border-2 border-green-600 border-t-transparent"></div>
                  ) : selectedPhoto ? (
                    <Check size={12} />
                  ) : (
                    <Camera size={12} />
                  )}
                </Button>
              </div>
              <div className="text-center">
                <p className="text-white font-semibold text-sm mb-0.5">
                  {selectedPhoto ? 'Photo Selected' : 'Change Photo'}
                </p>
                <p className="text-white/70 text-xs">
                  {isUploadingPhoto ? 'Uploading...' : 'Tap camera to update'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Form Section */}
        <div className="px-3 -mt-3 pb-6 space-y-3 max-w-md mx-auto">
          
          {/* Personal Information Card */}
          <Card className="border-0 shadow-xl bg-white/95 backdrop-blur-sm rounded-2xl overflow-hidden">
            <CardContent className="p-4">
              <div className="flex items-center gap-2.5 mb-3">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg">
                  <User size={16} className="text-white" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-gray-800">Personal Information</h2>
                  <p className="text-gray-500 text-xs">Your basic details</p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="space-y-1">
                  <Label htmlFor="fullName" className="text-sm font-semibold text-gray-700">
                    Full Name
                  </Label>
                  <Input
                    id="fullName"
                    value={formData.fullName}
                    onChange={(e) => handleInputChange('fullName', e.target.value)}
                    className="h-10 rounded-xl border-2 border-gray-100 focus:border-blue-500 focus:ring-blue-500/20 bg-gray-50/80 text-sm font-medium transition-all duration-200"
                    placeholder="Enter your full name"
                    disabled={isUpdating}
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="phoneNumber" className="text-sm font-semibold text-gray-700">
                    Phone Number
                  </Label>
                  <div className="relative">
                    <Input
                      id="phoneNumber"
                      value={formData.phoneNumber}
                      className="h-10 rounded-xl border-2 border-gray-200 bg-gray-100 pr-10 text-sm font-medium"
                      disabled
                    />
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <div className="w-4 h-4 rounded-lg bg-red-100 flex items-center justify-center shadow-sm">
                        <X size={8} className="text-red-600" />
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-red-600 font-medium">Cannot be changed for security</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contact Information Card */}
          <Card className="border-0 shadow-xl bg-white/95 backdrop-blur-sm rounded-2xl overflow-hidden">
            <CardContent className="p-4">
              <div className="flex items-center gap-2.5 mb-3">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg">
                  <Mail size={16} className="text-white" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-gray-800">Contact Information</h2>
                  <p className="text-gray-500 text-xs">How we reach you</p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="space-y-1">
                  <Label htmlFor="email" className="text-sm font-semibold text-gray-700">
                    Email Address
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className="h-10 rounded-xl border-2 border-gray-100 focus:border-green-500 focus:ring-green-500/20 bg-gray-50/80 text-sm font-medium transition-all duration-200"
                    placeholder="Enter your email address"
                    disabled={isUpdating}
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="address" className="text-sm font-semibold text-gray-700">
                    Address
                  </Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    placeholder="Enter your address"
                    className="h-10 rounded-xl border-2 border-gray-100 focus:border-green-500 focus:ring-green-500/20 bg-gray-50/80 text-sm font-medium transition-all duration-200"
                    disabled={isUpdating}
                  />
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div className="space-y-1">
                    <Label htmlFor="city" className="text-sm font-semibold text-gray-700">
                      City
                    </Label>
                    <Input
                      id="city"
                      value={formData.city}
                      onChange={(e) => handleInputChange('city', e.target.value)}
                      placeholder="City"
                      className="h-10 rounded-xl border-2 border-gray-100 focus:border-green-500 focus:ring-green-500/20 bg-gray-50/80 text-sm font-medium transition-all duration-200"
                      disabled={isUpdating}
                    />
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="country" className="text-sm font-semibold text-gray-700">
                      Country
                    </Label>
                    <Input
                      id="country"
                      value={formData.country}
                      onChange={(e) => handleInputChange('country', e.target.value)}
                      className="h-10 rounded-xl border-2 border-gray-100 focus:border-green-500 focus:ring-green-500/20 bg-gray-50/80 text-sm font-medium transition-all duration-200"
                      disabled={isUpdating}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="space-y-2.5 pt-2">
            <Button 
              onClick={handleSaveProfile}
              disabled={isUpdating || isUploadingPhoto}
              className="w-full h-11 bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500 hover:from-green-600 hover:via-emerald-600 hover:to-teal-600 text-white text-base font-bold rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] border-0 disabled:opacity-50"
            >
              <Save size={16} className="mr-2" />
              {isUpdating ? 'Saving Changes...' : isUploadingPhoto ? 'Uploading Photo...' : 'Save Changes'}
            </Button>
            
            <Button 
              variant="outline" 
              onClick={() => navigate('/my-account')}
              disabled={isUpdating || isUploadingPhoto}
              className="w-full h-10 border-2 border-gray-200 hover:border-gray-300 text-gray-700 hover:bg-gray-50 text-sm font-semibold rounded-2xl transition-all duration-200 hover:shadow-lg transform hover:scale-[1.01] active:scale-[0.99] bg-white/80 backdrop-blur-sm disabled:opacity-50"
            >
              Cancel
            </Button>
          </div>
        </div>
      </AppLayout>
    </div>
  );
};

export default ProfileEdit;
