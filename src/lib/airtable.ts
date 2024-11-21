import Airtable from 'airtable';

// Configure Airtable
const AIRTABLE_API_KEY = 'patqPxXtfi8dh0OUy.18889478a32a083ab4e43aad9f321c8edbb923e3184f0579e4c9bd217fdda2a1';
const AIRTABLE_BASE_ID = 'appKnXYgk0okXcocR';
const TABLE_NAME = 'test base';

// Initialize Airtable
const base = new Airtable({
  apiKey: AIRTABLE_API_KEY,
  endpointUrl: 'https://api.airtable.com',
}).base(AIRTABLE_BASE_ID);

// Create a temporary URL for the file
const createTempFileUrl = async (file: File): Promise<string> => {
  const formData = new FormData();
  formData.append('file', file);
  
  try {
    const response = await fetch('https://tmpfiles.org/api/v1/upload', {
      method: 'POST',
      body: formData
    });
    
    if (!response.ok) {
      throw new Error('Failed to upload file');
    }
    
    const data = await response.json();
    const downloadUrl = data.data.url.replace('https://tmpfiles.org/', 'https://tmpfiles.org/dl/');
    return downloadUrl;
  } catch (error) {
    console.error('File upload error:', error);
    throw new Error('Failed to upload file. Please try again.');
  }
};

// Helper function to check if an object is empty
const isEmptyObject = (obj: any) => {
  return obj && Object.keys(obj).length === 0 && obj.constructor === Object;
};

// Verify Airtable connection
const verifyConnection = async () => {
  try {
    const table = base(TABLE_NAME);
    await table.select({ maxRecords: 1 }).firstPage();
    return { success: true };
  } catch (error: any) {
    return { 
      success: false, 
      error: isEmptyObject(error) 
        ? 'Connection failed. Please check your internet connection and Airtable credentials.' 
        : error.message || 'Connection verification failed'
    };
  }
};

type AdditionalFields = {
  homeOwnership: string;
  electricityBill: string;
};

export const addContact = async (
  name: string,
  email: string,
  phone: string,
  address: string,
  pdf?: File | null,
  additionalFields?: AdditionalFields
) => {
  if (!name || !email || !phone || !address) {
    throw new Error('Required fields are missing');
  }

  try {
    // Verify connection before proceeding
    const connectionStatus = await verifyConnection();
    if (!connectionStatus.success) {
      throw new Error(connectionStatus.error);
    }

    const fields: Record<string, any> = {
      'Name': name.trim(),
      'Email': email.trim(),
      'Phone': phone.trim(),
      'Address': address.trim(),
      'Home Ownership': additionalFields?.homeOwnership === 'own' ? 'Yes' : 'No',
      'Monthly Bill': additionalFields?.electricityBill ? `$${additionalFields.electricityBill}` : undefined
    };

    if (pdf) {
      try {
        // Get a temporary URL for the file
        const fileUrl = await createTempFileUrl(pdf);
        
        // Set up the attachment object in the format Airtable expects
        fields['PDF'] = [{
          url: fileUrl,
          filename: pdf.name
        }];
      } catch (error) {
        console.error('PDF processing error:', error);
        throw new Error('Failed to process PDF file. Please try again.');
      }
    }

    const table = base(TABLE_NAME);
    const records = await table.create([{ fields }]);

    if (!records || records.length === 0) {
      throw new Error('Failed to create contact record');
    }

    return records[0];
  } catch (error: any) {
    console.error('Complete error object:', JSON.stringify(error));
    
    // Handle empty error objects
    if (isEmptyObject(error)) {
      throw new Error('An unexpected error occurred. Please check your internet connection and try again.');
    }

    // Handle specific error cases
    const errorMessage = error.error === 'INVALID_ATTACHMENT_OBJECT' 
      ? 'Invalid PDF format or file too large. Please try a different PDF file under 5MB.'
      : error.message || 
        (error.statusCode === 403 ? 'Permission denied. Please verify your Airtable API key and access rights.' :
         error.statusCode === 404 ? 'Table or base not found. Please verify your Airtable configuration.' :
         error.statusCode === 413 ? 'The PDF file is too large. Please try a smaller file.' :
         error.statusCode === 422 ? 'Invalid data format. Please check your input.' :
         'Failed to add contact. Please try again.');

    throw new Error(errorMessage);
  }
};