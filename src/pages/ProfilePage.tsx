
import React from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import UserProfileForm from '@/components/auth/UserProfileForm';

const ProfilePage: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="flex-grow container mx-auto px-4 py-8">
        <UserProfileForm />
      </div>
      <Footer />
    </div>
  );
};

export default ProfilePage;
