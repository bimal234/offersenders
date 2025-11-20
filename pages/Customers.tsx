import React, { useState } from 'react';
import type { Customer } from '../types';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { EditIcon } from '../components/icons/EditIcon';
import { TrashIcon } from '../components/icons/TrashIcon';

interface CustomersProps {
  customers: Customer[];
  onAddCustomer: (customer: Omit<Customer, 'id' | 'created_at' | 'business_id'>) => Promise<void>;
  onUpdateCustomer: (customer: Customer) => Promise<void>;
  onDeleteCustomer: (customerId: string) => Promise<void>;
}

export const Customers: React.FC<CustomersProps> = ({ customers, onAddCustomer, onUpdateCustomer, onDeleteCustomer }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentCustomer, setCurrentCustomer] = useState<Partial<Customer> | null>(null);

  const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      alert(`Importing ${file.name}... (simulation)`);
    }
  };

  const handleOpenModal = (customer?: Customer) => {
    setCurrentCustomer(customer ? { ...customer } : { name: '', phone: '' });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setCurrentCustomer(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentCustomer || !currentCustomer.name?.trim() || !currentCustomer.phone?.trim()) {
      alert('Name and Phone Number are required.');
      return;
    }

    if (currentCustomer.id) {
      await onUpdateCustomer(currentCustomer as Customer);
    } else {
      await onAddCustomer({ name: currentCustomer.name, phone: currentCustomer.phone });
    }
    handleCloseModal();
  };
  
  const handleDelete = async (customerId: string) => {
    if (window.confirm('Are you sure you want to delete this customer?')) {
      await onDeleteCustomer(customerId);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (currentCustomer) {
      setCurrentCustomer({
        ...currentCustomer,
        [e.target.name]: e.target.value,
      });
    }
  };


  return (
    <main className="flex-1 overflow-y-auto p-8">
      {isModalOpen && currentCustomer && (
        <Modal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          title={currentCustomer.id ? 'Edit Customer' : 'Add New Customer'}
          footer={
            <>
              <Button variant="secondary" onClick={handleCloseModal}>Cancel</Button>
              <Button type="submit" form="customer-form">Save Customer</Button>
            </>
          }
        >
          <form id="customer-form" onSubmit={handleSave} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">Full Name</label>
              <input
                type="text"
                id="name"
                name="name"
                value={currentCustomer.name || ''}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                required
              />
            </div>
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700">Phone Number</label>
              <input
                type="text"
                id="phone"
                name="phone"
                value={currentCustomer.phone || ''}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                placeholder="+64211234567"
                required
              />
            </div>
          </form>
        </Modal>
      )}

      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-800">Your Customers ({customers.length})</h2>
        <div className="flex space-x-2">
            <label htmlFor="csv-import" className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 cursor-pointer">
                Import CSV
            </label>
            <input id="csv-import" type="file" className="hidden" accept=".csv" onChange={handleFileImport} />
            <Button onClick={() => handleOpenModal()}>
                Add Customer
            </Button>
        </div>
      </div>

      <div className="bg-white shadow-sm rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone Number</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Added On</th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {customers.map((customer) => (
                <tr key={customer.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{customer.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{customer.phone}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(customer.created_at).toLocaleDateString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                    <button onClick={() => handleOpenModal(customer)} className="text-indigo-600 hover:text-indigo-900 p-1 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500" aria-label={`Edit ${customer.name}`}>
                        <EditIcon />
                    </button>
                    <button onClick={() => handleDelete(customer.id)} className="text-red-600 hover:text-red-900 p-1 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500" aria-label={`Delete ${customer.name}`}>
                        <TrashIcon />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
};