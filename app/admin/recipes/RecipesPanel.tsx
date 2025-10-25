'use client';

import React, { useState, useRef } from 'react';
import { getRecipes, addRecipe, updateRecipe, deleteRecipe, Recipe } from '../../lib/recipes-supabase';
import { uploadImage, uploadFile, isValidImageFile, isValidPDFFile, isValidFileSize } from '../../lib/storage-supabase';
import Image from 'next/image';
import { FiPlus, FiTrash2, FiEdit2, FiX } from 'react-icons/fi';

export default function RecipesPanel({ admin }: { admin: any }) {
  const imageInputRef = useRef<HTMLInputElement>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [selectedPDFFile, setSelectedPDFFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    image: '',
    pdf_url: ''
  });

  // Fetch recipes
  const fetchRecipes = async () => {
    try {
      setLoading(true);
      const fetchedRecipes = await getRecipes();
      setRecipes(fetchedRecipes);
    } catch (err) {
      setError('Failed to load recipes');
    } finally {
      setLoading(false);
    }
  };

  // Fetch on mount if admin
  React.useEffect(() => {
    if (admin) fetchRecipes();
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

  const handlePDFFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!isValidPDFFile(file)) {
      setError('Please select a valid PDF file');
      return;
    }

    if (!isValidFileSize(file, 10)) {
      setError('PDF file size must be less than 10MB');
      return;
    }

    setSelectedPDFFile(file);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setError(null);

      // Validate required fields
      if (!formData.name || !formData.description || !formData.price) {
        setError('Please fill in all required fields');
        return;
      }

      // When adding a new recipe, require image and PDF
      if (!editingId && (!selectedImageFile || !selectedPDFFile)) {
        setError('Please select both an image and a PDF file');
        return;
      }

      setUploading(true);

      let imageUrl = formData.image;
      let pdfUrl = formData.pdf_url;

      // Only allow file uploads when creating a new recipe (not editing)
      if (!editingId) {
        // Upload new image if selected
        if (selectedImageFile) {
          try {
            imageUrl = await uploadImage(selectedImageFile, 'recipes');
          } catch (uploadError) {
            throw new Error('Failed to upload image');
          }
        }

        // Upload new PDF if selected
        if (selectedPDFFile) {
          try {
            pdfUrl = await uploadFile(selectedPDFFile, 'recipes/pdfs');
          } catch (uploadError) {
            throw new Error('Failed to upload PDF');
          }
        }
      }

      const recipeData = {
        name: formData.name,
        description: formData.description,
        price: formData.price,
        image: imageUrl,
        pdf_url: pdfUrl
      };

      if (editingId) {
        // When editing, only update name, description, and price (not files)
        await updateRecipe(editingId, recipeData);
        setEditingId(null);
        setIsAdding(false); // Close the form after editing
      } else {
        await addRecipe(recipeData);
        setIsAdding(false);
      }

      // Reset form
      setFormData({ name: '', description: '', price: '', image: '', pdf_url: '' });
      setSelectedImageFile(null);
      setSelectedPDFFile(null);
      setImagePreview(null);
      if (imageInputRef.current) imageInputRef.current.value = '';
      if (pdfInputRef.current) pdfInputRef.current.value = '';

      fetchRecipes();
    } catch (err) {
      setError('Failed to save recipe');
    } finally {
      setUploading(false);
    }
  };

  const handleEdit = (recipe: Recipe) => {
    setEditingId(recipe.id || null);
    setFormData({
      name: recipe.name,
      description: recipe.description,
      price: recipe.price,
      image: recipe.image,
      pdf_url: recipe.pdf_url
    });
    setImagePreview(recipe.image);
    setSelectedImageFile(null);
    setSelectedPDFFile(null);
    setIsAdding(true);
  };

  const handleDelete = async (id: string, imageUrl: string, pdfUrl: string) => {
    if (window.confirm('Are you sure you want to delete this recipe?')) {
      try {
        await deleteRecipe(id, imageUrl, pdfUrl);
        fetchRecipes();
      } catch (err) {
        setError('Failed to delete recipe');
      }
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
    setIsAdding(false);
    setFormData({ name: '', description: '', price: '', image: '', pdf_url: '' });
    setSelectedImageFile(null);
    setSelectedPDFFile(null);
    setImagePreview(null);
    if (imageInputRef.current) imageInputRef.current.value = '';
    if (pdfInputRef.current) pdfInputRef.current.value = '';
  };

  if (loading) {
    return <div className="text-center py-8">Loading recipes...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-deep-green">Manage Recipes</h2>
        {!isAdding && !editingId && (
          <button
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-2 px-4 py-2 bg-sage-green text-white rounded-md hover:bg-deep-green transition-colors"
          >
            <FiPlus /> Add Recipe
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
            <h3 className="text-xl font-semibold text-deep-green">
              {editingId ? 'Edit Recipe' : 'Add New Recipe'}
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
                Recipe Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sage-green"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Short Description *
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sage-green"
                rows={3}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Price *
              </label>
              <input
                type="text"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                placeholder="$9.99"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sage-green"
                required
              />
            </div>

            {!editingId && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Recipe Image * (Max 5MB)
                  </label>
                  <input
                    ref={imageInputRef}
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
                    onChange={handleImageFileSelect}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sage-green"
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

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Recipe PDF * (Max 10MB)
                  </label>
                  <input
                    ref={pdfInputRef}
                    type="file"
                    accept="application/pdf"
                    onChange={handlePDFFileSelect}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sage-green"
                  />
                  {selectedPDFFile && (
                    <p className="mt-1 text-sm text-gray-600">
                      Selected: {selectedPDFFile.name}
                    </p>
                  )}
                </div>
              </>
            )}

            {editingId && (
              <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                <p className="text-sm text-blue-800">
                  <strong>Note:</strong> You can only edit the name, description, and price. To change the image or PDF, please delete this recipe and create a new one.
                </p>
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                disabled={uploading}
                className="px-6 py-2 bg-sage-green text-white rounded-md hover:bg-deep-green transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {uploading ? 'Saving...' : editingId ? 'Update Recipe' : 'Add Recipe'}
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

      {/* Recipes List */}
      {recipes.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-8 text-center text-gray-500">
          No recipes yet. Click &quot;Add Recipe&quot; to create one.
        </div>
      ) : (
        <>
          {/* Mobile Card View */}
          <div className="md:hidden space-y-4">
            {recipes.map((recipe) => (
              <div key={recipe.id} className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200">
                <div className="relative h-48 w-full">
                  <Image
                    src={recipe.image}
                    alt={recipe.name}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">{recipe.name}</h3>
                    <span className="text-lg font-bold text-sage-green">{recipe.price}</span>
                  </div>
                  <p className="text-sm text-gray-600 mb-4">{recipe.description}</p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(recipe)}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100 transition-colors"
                    >
                      <FiEdit2 size={16} />
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(recipe.id!, recipe.image, recipe.pdf_url)}
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
                <thead className="bg-sage-green text-white">
                  <tr>
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
                      Price
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {recipes.map((recipe) => (
                    <tr key={recipe.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Image
                          src={recipe.image}
                          alt={recipe.name}
                          width={80}
                          height={80}
                          className="rounded-md object-cover"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">
                          {recipe.name}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-600 max-w-xs">
                          {recipe.description}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-semibold text-sage-green">
                          {recipe.price}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEdit(recipe)}
                            className="text-blue-600 hover:text-blue-800"
                            title="Edit"
                          >
                            <FiEdit2 size={18} />
                          </button>
                          <button
                            onClick={() => handleDelete(recipe.id!, recipe.image, recipe.pdf_url)}
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
