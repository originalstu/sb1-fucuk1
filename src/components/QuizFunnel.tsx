import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, Send, Home, Zap, User, Mail, Phone, FileUp, X, Loader2, Sun } from 'lucide-react';
import { addContact } from '../lib/airtable';
import toast from 'react-hot-toast';
import AddressInput from './AddressInput';
import { QuizStep, FormData } from '../types';
import { Button } from './ui/button';
import { cn } from '../lib/utils';
import { formatFileSize, formatPhoneNumber, validatePhoneNumber } from '../lib/utils';

const QUIZ_STEPS: QuizStep[] = [
  {
    question: "Do you own your home?",
    subtext: "To qualify for solar rebates, you need to be the property owner",
    field: 'homeOwnership',
    type: 'select',
    options: [
      { value: 'own', label: 'Yes, I own my home' },
      { value: 'rent', label: 'No, I rent my home' },
      { value: 'other', label: 'Other' }
    ],
    icon: <Home className="h-6 w-6 text-yellow-500" />
  },
  {
    question: "What's your average monthly electricity bill?",
    subtext: "This helps us calculate your potential savings",
    field: 'electricityBill',
    type: 'range',
    icon: <Zap className="h-6 w-6 text-yellow-500" />
  },
  {
    question: "What's your address?",
    subtext: "We'll check solar panel compatibility for your roof",
    field: 'address',
    type: 'address',
    icon: <Home className="h-6 w-6 text-yellow-500" />
  },
  {
    question: "What's your first name?",
    field: 'firstName',
    type: 'text',
    placeholder: 'John',
    icon: <User className="h-6 w-6 text-yellow-500" />
  },
  {
    question: "What's your last name?",
    field: 'lastName',
    type: 'text',
    placeholder: 'Doe',
    icon: <User className="h-6 w-6 text-yellow-500" />
  },
  {
    question: "What's your email address?",
    subtext: "We'll send your solar savings estimate here",
    field: 'email',
    type: 'email',
    placeholder: 'john@example.com',
    icon: <Mail className="h-6 w-6 text-yellow-500" />
  },
  {
    question: "What's your phone number?",
    subtext: "We'll only use this to discuss your solar options",
    field: 'phone',
    type: 'tel',
    placeholder: '0400 000 000',
    icon: <Phone className="h-6 w-6 text-yellow-500" />
  },
  {
    question: "Upload your latest electricity bill",
    subtext: "This helps us provide a more accurate savings estimate (optional)",
    field: 'pdf',
    type: 'file',
    icon: <FileUp className="h-6 w-6 text-yellow-500" />
  }
];

const validateField = (field: keyof FormData, value: any): string => {
  if (!value && field !== 'pdf') return 'This field is required';
  
  switch (field) {
    case 'email':
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        return 'Please enter a valid email address';
      }
      break;
    case 'phone':
      if (!validatePhoneNumber(value)) {
        return 'Please enter a valid Australian mobile number';
      }
      break;
    case 'pdf':
      if (value && value.size > 10 * 1024 * 1024) {
        return 'File must be less than 10MB';
      }
      if (value && !['application/pdf', 'image/jpeg', 'image/png', 'image/heic'].includes(value.type)) {
        return 'Please upload a PDF or image file';
      }
      break;
  }
  
  return '';
};

export default function QuizFunnel() {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<FormData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    homeOwnership: '',
    electricityBill: '400',
    pdf: null
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [complete, setComplete] = useState(false);
  const [addressValid, setAddressValid] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'file') {
      const fileInput = e.target as HTMLInputElement;
      const file = fileInput.files?.[0];
      
      if (file) {
        const validationError = validateField('pdf', file);
        if (validationError) {
          setError(validationError);
          return;
        }
      }
      
      setFormData(prev => ({
        ...prev,
        pdf: file || null
      }));
      setError('');
    } else if (name === 'phone') {
      const formattedPhone = formatPhoneNumber(value);
      setFormData(prev => ({
        ...prev,
        [name]: formattedPhone
      }));
      setError('');
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
      setError('');

      if (name === 'homeOwnership' && value !== 'own') {
        setTimeout(() => {
          toast.error("Sorry, you must be a homeowner to qualify for solar rebates");
          setFormData(prev => ({ ...prev, homeOwnership: '' }));
        }, 500);
        return;
      }
    }
  };

  const handleAddressChange = (address: string, isValid: boolean) => {
    setFormData(prev => ({
      ...prev,
      address
    }));
    setAddressValid(isValid);
    setError('');
  };

  const handleNext = () => {
    const currentField = QUIZ_STEPS[currentStep].field;
    
    if (currentField === 'homeOwnership' && formData.homeOwnership !== 'own') {
      setError('You must be a homeowner to qualify for solar rebates');
      return;
    }
    
    if (currentField === 'address' && !addressValid) {
      setError('Please enter a valid address');
      return;
    }
    
    const validationError = validateField(currentField, formData[currentField]);
    
    if (validationError) {
      setError(validationError);
      return;
    }
    
    if (currentStep < QUIZ_STEPS.length - 1) {
      setCurrentStep(prev => prev + 1);
      setError('');
    } else {
      handleSubmit();
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError('');

    try {
      await addContact(
        `${formData.firstName} ${formData.lastName}`,
        formData.email,
        formData.phone,
        formData.address,
        formData.pdf,
        {
          homeOwnership: formData.homeOwnership,
          electricityBill: formData.electricityBill
        }
      );
      
      setComplete(true);
      toast.success("Thank you! We'll be in touch soon with your solar savings estimate.");
    } catch (error: any) {
      toast.error(error.message || 'Something went wrong');
      setError(error.message || 'Failed to submit. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleNext();
    }
  };

  if (complete) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center p-8 bg-white rounded-lg shadow-lg"
      >
        <div className="relative w-24 h-24 mx-auto mb-6 bg-green-100 rounded-full">
          <Sun className="absolute inset-0 m-auto h-12 w-12 text-green-600 animate-pulse" />
        </div>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h2 className="text-2xl font-bold text-green-600 mb-4">Congratulations!</h2>
          <p className="text-gray-600 mb-4">You've qualified for solar rebates!</p>
          <p className="text-gray-600">Our solar experts will analyze your information and contact you within 24 hours with your personalized savings estimate.</p>
        </motion.div>
      </motion.div>
    );
  }

  const currentQuestion = QUIZ_STEPS[currentStep];

  return (
    <div className="max-w-xl mx-auto">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-lg shadow-lg p-8"
      >
        <div className="text-center mb-8">
          <motion.h1 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl font-bold bg-gradient-to-r from-yellow-500 to-orange-500 bg-clip-text text-transparent mb-2"
          >
            Solar Rebate Checker
          </motion.h1>
          <p className="text-gray-600">Find out if you qualify for solar rebates in your area</p>
        </div>

        <div className="mb-8">
          <div className="flex justify-between mb-4">
            {QUIZ_STEPS.map((_, index) => (
              <motion.div
                key={index}
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                className={cn(
                  "h-1 flex-1 mx-1 rounded transition-colors duration-300",
                  index <= currentStep ? "bg-yellow-500" : "bg-gray-200"
                )}
              />
            ))}
          </div>
          <p className="text-sm text-gray-500 text-right">
            Step {currentStep + 1} of {QUIZ_STEPS.length}
          </p>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ x: 50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -50, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="space-y-6"
          >
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-3 mb-2"
            >
              {currentQuestion.icon}
              <h2 className="text-2xl font-bold text-gray-800">{currentQuestion.question}</h2>
            </motion.div>
            
            {currentQuestion.subtext && (
              <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-gray-600"
              >
                {currentQuestion.subtext}
              </motion.p>
            )}

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              {currentQuestion.type === 'address' ? (
                <AddressInput
                  value={formData.address}
                  onChange={handleAddressChange}
                  error={error}
                />
              ) : currentQuestion.type === 'select' ? (
                <select
                  name={currentQuestion.field}
                  value={formData[currentQuestion.field] as string}
                  onChange={handleChange}
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 bg-white"
                >
                  <option value="">Select an option</option>
                  {currentQuestion.options?.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              ) : currentQuestion.type === 'range' ? (
                <div className="space-y-4">
                  <input
                    type="range"
                    name={currentQuestion.field}
                    min="0"
                    max="800"
                    step="50"
                    value={formData.electricityBill}
                    onChange={handleChange}
                    className="range-slider"
                  />
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>$0</span>
                    <span className="font-semibold text-yellow-600">${formData.electricityBill}</span>
                    <span>$800+</span>
                  </div>
                </div>
              ) : currentQuestion.type === 'file' ? (
                <div className="mt-1">
                  {formData.pdf ? (
                    <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                      <div className="flex items-center space-x-2">
                        <FileUp className="h-5 w-5 text-yellow-500" />
                        <div>
                          <span className="text-sm font-medium text-gray-700 truncate">
                            {formData.pdf.name}
                          </span>
                          <span className="text-xs text-gray-500 ml-2">
                            ({formatFileSize(formData.pdf.size)})
                          </span>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setFormData(prev => ({ ...prev, pdf: null }))}
                        className="text-gray-400 hover:text-gray-500"
                      >
                        <X size={18} />
                      </Button>
                    </div>
                  ) : (
                    <div className="relative group">
                      <div className="flex justify-center px-6 pt-5 pb-6 border-2 border-yellow-200 border-dashed rounded-lg bg-yellow-50/50 group-hover:bg-yellow-50 transition-colors">
                        <div className="space-y-2 text-center">
                          <FileUp className="mx-auto h-12 w-12 text-yellow-500" />
                          <div className="flex text-sm text-gray-600">
                            <label className="relative cursor-pointer rounded-md font-medium text-yellow-600 hover:text-yellow-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-yellow-500 focus-within:ring-offset-2">
                              <span>Upload bill</span>
                              <input
                                type="file"
                                name="pdf"
                                className="sr-only"
                                accept=".pdf,image/*"
                                capture="environment"
                                onChange={handleChange}
                              />
                            </label>
                            <p className="pl-1">or drag and drop</p>
                          </div>
                          <p className="text-xs text-gray-500">PDF or image up to 10MB</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="relative">
                  <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                    {currentQuestion.type === 'email' ? (
                      <Mail className="h-5 w-5 text-gray-400" />
                    ) : currentQuestion.type === 'tel' ? (
                      <Phone className="h-5 w-5 text-gray-400" />
                    ) : (
                      <User className="h-5 w-5 text-gray-400" />
                    )}
                  </div>
                  <input
                    type={currentQuestion.type}
                    name={currentQuestion.field}
                    value={formData[currentQuestion.field] as string}
                    onChange={handleChange}
                    onKeyPress={handleKeyPress}
                    className="w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                    placeholder={currentQuestion.placeholder}
                  />
                </div>
              )}
            </motion.div>

            {error && (
              <motion.p 
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-2 text-sm text-red-600 flex items-center gap-1"
              >
                <X size={16} className="inline" />
                {error}
              </motion.p>
            )}

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Button
                onClick={handleNext}
                disabled={loading}
                className="w-full"
              >
                {loading ? (
                  <Loader2 className="animate-spin" />
                ) : currentStep === QUIZ_STEPS.length - 1 ? (
                  <>
                    <Sun size={20} className="mr-2" />
                    Check My Eligibility
                  </>
                ) : (
                  <>
                    Continue
                    <ChevronRight size={20} className="ml-2" />
                  </>
                )}
              </Button>
            </motion.div>
          </motion.div>
        </AnimatePresence>
      </motion.div>
    </div>
  );
}