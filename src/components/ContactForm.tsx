import React, { useState, useRef } from 'react';
import { UserPlus, FileUp, X } from 'lucide-react';
import { addContact } from '../lib/airtable';
import toast from 'react-hot-toast';

type FormData = {
  name: string;
  email: string;
  phone: string;
  address: string;
  pdf?: File | null;
};

const validateForm = (data: FormData) => {
  const errors: Partial<Record<keyof FormData, string>> = {};
  
  if (!data.name.trim()) {
    errors.name = 'Name is required';
  }
  
  if (!data.email.trim()) {
    errors.email = 'Email is required';
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.email = 'Please enter a valid email address';
  }
  
  if (!data.phone.trim()) {
    errors.phone = 'Phone number is required';
  } else if (!/^\+?[\d\s-()]+$/.test(data.phone)) {
    errors.phone = 'Please enter a valid phone number';
  }

  if (!data.address.trim()) {
    errors.address = 'Address is required';
  }

  if (data.pdf) {
    if (data.pdf.size > 5 * 1024 * 1024) { // 5MB limit
      errors.pdf = 'PDF file size must be less than 5MB';
    }
  }
  
  return errors;
};

export default function ContactForm() {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    phone: '',
    address: '',
    pdf: null
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validationErrors = validateForm(formData);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    
    setLoading(true);
    setErrors({});

    try {
      await addContact(formData.name, formData.email, formData.phone, formData.address, formData.pdf);
      toast.success('Contact added successfully!');
      setFormData({ name: '', email: '', phone: '', address: '', pdf: null });
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to add contact');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'file') {
      const fileInput = e.target as HTMLInputElement;
      const file = fileInput.files?.[0];
      if (file && file.type !== 'application/pdf') {
        setErrors(prev => ({
          ...prev,
          pdf: 'Please upload a PDF file'
        }));
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        return;
      }
      setFormData(prev => ({
        ...prev,
        pdf: file || null
      }));
      // Clear any previous PDF errors
      setErrors(prev => ({
        ...prev,
        pdf: ''
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
      // Clear field-specific error when user starts typing
      if (errors[name as keyof FormData]) {
        setErrors(prev => ({
          ...prev,
          [name]: ''
        }));
      }
    }
  };

  const handleRemovePDF = () => {
    setFormData(prev => ({
      ...prev,
      pdf: null
    }));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    // Clear any PDF-related errors
    setErrors(prev => ({
      ...prev,
      pdf: ''
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700">
          Name
        </label>
        <input
          type="text"
          name="name"
          id="name"
          value={formData.name}
          onChange={handleChange}
          className={`mt-1 block w-full rounded-md shadow-sm px-4 py-2 ${
            errors.name 
              ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
              : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
          }`}
          placeholder="John Doe"
        />
        {errors.name && (
          <p className="mt-1 text-sm text-red-600">{errors.name}</p>
        )}
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700">
          Email
        </label>
        <input
          type="email"
          name="email"
          id="email"
          value={formData.email}
          onChange={handleChange}
          className={`mt-1 block w-full rounded-md shadow-sm px-4 py-2 ${
            errors.email 
              ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
              : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
          }`}
          placeholder="john@example.com"
        />
        {errors.email && (
          <p className="mt-1 text-sm text-red-600">{errors.email}</p>
        )}
      </div>

      <div>
        <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
          Phone
        </label>
        <input
          type="tel"
          name="phone"
          id="phone"
          value={formData.phone}
          onChange={handleChange}
          className={`mt-1 block w-full rounded-md shadow-sm px-4 py-2 ${
            errors.phone 
              ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
              : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
          }`}
          placeholder="+1 (555) 000-0000"
        />
        {errors.phone && (
          <p className="mt-1 text-sm text-red-600">{errors.phone}</p>
        )}
      </div>

      <div>
        <label htmlFor="address" className="block text-sm font-medium text-gray-700">
          Address
        </label>
        <textarea
          name="address"
          id="address"
          value={formData.address}
          onChange={handleChange}
          rows={3}
          className={`mt-1 block w-full rounded-md shadow-sm px-4 py-2 ${
            errors.address 
              ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
              : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
          }`}
          placeholder="Enter your full address"
        />
        {errors.address && (
          <p className="mt-1 text-sm text-red-600">{errors.address}</p>
        )}
      </div>

      <div>
        <label htmlFor="pdf" className="block text-sm font-medium text-gray-700">
          PDF Document (Optional, max 5MB)
        </label>
        <div className="mt-1">
          {formData.pdf ? (
            <div className="flex items-center justify-between p-2 bg-gray-50 rounded-md border border-gray-300">
              <span className="text-sm text-gray-600 truncate">{formData.pdf.name}</span>
              <button
                type="button"
                onClick={handleRemovePDF}
                className="ml-2 text-gray-400 hover:text-gray-500"
              >
                <X size={18} />
              </button>
            </div>
          ) : (
            <div className="flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
              <div className="space-y-1 text-center">
                <FileUp className="mx-auto h-12 w-12 text-gray-400" />
                <div className="flex text-sm text-gray-600">
                  <label
                    htmlFor="pdf"
                    className="relative cursor-pointer rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500"
                  >
                    <span>Upload a PDF</span>
                    <input
                      id="pdf"
                      name="pdf"
                      type="file"
                      ref={fileInputRef}
                      className="sr-only"
                      accept="application/pdf"
                      onChange={handleChange}
                    />
                  </label>
                  <p className="pl-1">or drag and drop</p>
                </div>
                <p className="text-xs text-gray-500">PDF up to 5MB</p>
              </div>
            </div>
          )}
          {errors.pdf && (
            <p className="mt-1 text-sm text-red-600">{errors.pdf}</p>
          )}
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full flex justify-center items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        <UserPlus size={20} />
        {loading ? 'Adding Contact...' : 'Add Contact'}
      </button>
    </form>
  );
}