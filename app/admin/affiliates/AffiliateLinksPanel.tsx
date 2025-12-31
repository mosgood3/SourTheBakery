'use client';

import React, { useState, useRef } from 'react';
import { getAffiliateLinks, addAffiliateLink, updateAffiliateLink, deleteAffiliateLink, AffiliateLink } from '../../lib/affiliates-supabase';
import { uploadImageCompressed, isValidImageFile, isValidFileSize } from '../../lib/storage-supabase';
import Image from 'next/image';
import { FiPlus, FiTrash2, FiEdit2, FiX, FiArrowUp, FiArrowDown, FiExternalLink } from 'react-icons/fi';

export default function AffiliateLinksPanel({ admin }: { admin: any }) {
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [links, setLinks] = useState<AffiliateLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    url: '',
    image: ''
  });

  // Fetch links
  const fetchLinks = async () => {
    try {
      setLoading(true);
      const fetchedLinks = await getAffiliateLinks();
      setLinks(fetchedLinks);
    } catch (err) {
      setError('Failed to load affiliate links');
    } finally {
      setLoading(false);
    }
  };

  // Fetch on mount if admin
  React.useEffect(() => {
    if (admin) fetchLinks();
  }, [admin]);

  const handleImageFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!isValidImageFile(file)) {
      setError('Please select a valid image file (JPEG, PNG, WebP, or GIF)');
      return;
    }

    if (!isValidFileSize(file, 5)) {
      setError('Image file size must be less than 5MB');
      return;
    }

    setSelectedImageFile(file);
    setError(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setError(null);

      // Validate required fields
      if (!formData.name || !formData.description || !formData.url) {
        setError('Please fill in all required fields');
        return;
      }

      // When adding a new link, require image
      if (!editingId && !selectedImageFile) {
        setError('Please select an image');
        return;
      }

      setUploading(true);

      let imageUrl = formData.image;

      // Upload new image if selected
      if (selectedImageFile) {
        try {
          imageUrl = await uploadImageCompressed(selectedImageFile, 'affiliates', 800, 85);
        } catch (uploadError) {
          throw new Error('Failed to upload image');
        }
      }

      const linkData = {
        name: formData.name,
        description: formData.description,
        url: formData.url,
        image: imageUrl
      };

      if (editingId) {
        await updateAffiliateLink(editingId, linkData);
        setEditingId(null);
        setIsAdding(false);
      } else {
        await addAffiliateLink(linkData);
        setIsAdding(false);
      }

      // Reset form
      setFormData({ name: '', description: '', url: '', image: '' });
      setSelectedImageFile(null);
      setImagePreview(null);
      if (imageInputRef.current) imageInputRef.current.value = '';

      fetchLinks();
    } catch (err) {
      setError('Failed to save affiliate link');
    } finally {
      setUploading(false);
    }
  };

  const handleEdit = (link: AffiliateLink) => {
    setEditingId(link.id || null);
    setFormData({
      name: link.name,
      description: link.description,
      url: link.url,
      image: link.image
    });
    setImagePreview(link.image);
    setSelectedImageFile(null);
    setIsAdding(true);
  };

  const handleDelete = async (id: string, imageUrl: string) => {
    if (window.confirm('Are you sure you want to delete this affiliate link?')) {
      try {
        await deleteAffiliateLink(id, imageUrl);
        fetchLinks();
      } catch (err) {
        setError('Failed to delete affiliate link');
      }
    }
  };

  const handleMoveUp = async (index: number) => {
    if (index === 0) return;

    const newLinks = [...links];
    const temp = newLinks[index];
    newLinks[index] = newLinks[index - 1];
    newLinks[index - 1] = temp;

    // Update sort orders
    const updates = newLinks.map((link, i) => ({
      id: link.id!,
      sort_order: i
    }));

    try {
      await Promise.all(
        updates.map((update) =>
          updateAffiliateLink(update.id, { sort_order: update.sort_order })
        )
      );
      setLinks(newLinks);
    } catch (err) {
      setError('Failed to reorder links');
    }
  };

  const handleMoveDown = async (index: number) => {
    if (index === links.length - 1) return;

    const newLinks = [...links];
    const temp = newLinks[index];
    newLinks[index] = newLinks[index + 1];
    newLinks[index + 1] = temp;

    // Update sort orders
    const updates = newLinks.map((link, i) => ({
      id: link.id!,
      sort_order: i
    }));

    try {
      await Promise.all(
        updates.map((update) =>
          updateAffiliateLink(update.id, { sort_order: update.sort_order })
        )
      );
      setLinks(newLinks);
    } catch (err) {
      setError('Failed to reorder links');
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
    setIsAdding(false);
    setFormData({ name: '', description: '', url: '', image: '' });
    setSelectedImageFile(null);
    setImagePreview(null);
    if (imageInputRef.current) imageInputRef.current.value = '';
  };

  if (loading) {
    return <div className="text-center py-8">Loading affiliate links...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-brown">Manage Affiliate Links</h2>
        {!isAdding && !editingId && (
          <button
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 transition-colors"
          >
            <FiPlus /> Add Link
          </button>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
          {error}
        </div>
      )}

      {/* Add/Edit Form */}
      {(isAdding || editingId) && (
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold text-brown">
              {editingId ? 'Edit Affiliate Link' : 'Add New Affiliate Link'}
            </h3>
            <button
              onClick={cancelEdit}
              className="text-gray-500 hover:text-gray-700"
            >
              <FiX size={24} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Kitchen Aid Mixer"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-accent-gold"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description *
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Brief description of the product and why you recommend it"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-accent-gold"
                rows={3}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Affiliate URL *
              </label>
              <input
                type="url"
                value={formData.url}
                onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                placeholder="https://..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-accent-gold"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Image {!editingId && '*'} (Max 5MB)
              </label>
              <input
                ref={imageInputRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
                onChange={handleImageFileSelect}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-accent-gold"
              />
              {imagePreview && (
                <div className="mt-2">
                  <Image
                    src={imagePreview}
                    alt="Preview"
                    width={200}
                    height={200}
                    className="rounded-md object-cover"
                  />
                </div>
              )}
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                disabled={uploading}
                className="px-6 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {uploading ? 'Saving...' : editingId ? 'Update Link' : 'Add Link'}
              </button>
              <button
                type="button"
                onClick={cancelEdit}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Links List */}
      {links.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-8 text-center text-gray-500">
          No affiliate links yet. Click &quot;Add Link&quot; to create one.
        </div>
      ) : (
        <>
          {/* Mobile Card View */}
          <div className="md:hidden space-y-4">
            {links.map((link, index) => (
              <div key={link.id} className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200">
                <div className="relative h-48 w-full">
                  <Image
                    src={link.image}
                    alt={link.name}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">{link.name}</h3>
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleMoveUp(index)}
                        disabled={index === 0}
                        className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                      >
                        <FiArrowUp size={16} />
                      </button>
                      <button
                        onClick={() => handleMoveDown(index)}
                        disabled={index === links.length - 1}
                        className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                      >
                        <FiArrowDown size={16} />
                      </button>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mb-4">{link.description}</p>
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-600 hover:underline flex items-center gap-1 mb-4"
                  >
                    <FiExternalLink size={12} />
                    View Link
                  </a>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(link)}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100 transition-colors"
                    >
                      <FiEdit2 size={16} />
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(link.id!, link.image)}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-md hover:bg-red-100 transition-colors"
                    >
                      <FiTrash2 size={16} />
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block bg-white rounded-lg shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-accent-gold text-white">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider w-12">
                      Order
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                      Image
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                      Description
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {links.map((link, index) => (
                    <tr key={link.id} className="hover:bg-gray-50">
                      <td className="px-4 py-4">
                        <div className="flex flex-col gap-1">
                          <button
                            onClick={() => handleMoveUp(index)}
                            disabled={index === 0}
                            className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                            title="Move up"
                          >
                            <FiArrowUp size={16} />
                          </button>
                          <button
                            onClick={() => handleMoveDown(index)}
                            disabled={index === links.length - 1}
                            className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                            title="Move down"
                          >
                            <FiArrowDown size={16} />
                          </button>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Image
                          src={link.image}
                          alt={link.name}
                          width={80}
                          height={80}
                          className="rounded-md object-cover"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">
                          {link.name}
                        </div>
                        <a
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-600 hover:underline flex items-center gap-1 mt-1"
                        >
                          <FiExternalLink size={12} />
                          View Link
                        </a>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-600 max-w-xs">
                          {link.description}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEdit(link)}
                            className="text-blue-600 hover:text-blue-800"
                            title="Edit"
                          >
                            <FiEdit2 size={18} />
                          </button>
                          <button
                            onClick={() => handleDelete(link.id!, link.image)}
                            className="text-red-600 hover:text-red-800"
                            title="Delete"
                          >
                            <FiTrash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
