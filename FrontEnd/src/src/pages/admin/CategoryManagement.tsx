import React, { useEffect, useState } from 'react';
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Tag,
  BookOpen,
  Calendar,
  X,
  Save,
} from 'lucide-react';
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  type Category,
} from '../../services/admin';

const CategoryManagement: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(
    null
  );
  const [searchTerm, setSearchTerm] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await getCategories();
      if (response.success) {
        setCategories(response.data);
      } else {
        setError(response.message);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch categories');
    } finally {
      setIsLoading(false);
    }
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  const handleNameChange = (name: string) => {
    setFormData({
      ...formData,
      name,
      slug: generateSlug(name),
    });
  };

  const handleCreateCategory = async () => {
    if (!formData.name.trim()) {
      setError('Category name is required');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      const response = await createCategory({
        name: formData.name.trim(),
        slug: formData.slug.trim(),
        description: formData.description.trim() || undefined,
      });

      if (response.success) {
        setCategories([...categories, response.data]);
        setShowCreateModal(false);
        setFormData({ name: '', slug: '', description: '' });
      } else {
        setError(response.message);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create category');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditCategory = (category: Category) => {
    setSelectedCategory(category);
    setFormData({
      name: category.name,
      slug: category.slug,
      description: category.description || '',
    });
    setShowEditModal(true);
  };

  const handleUpdateCategory = async () => {
    if (!selectedCategory || !formData.name.trim()) {
      setError('Category name is required');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      const response = await updateCategory(selectedCategory.id, {
        name: formData.name.trim(),
        slug: formData.slug.trim(),
        description: formData.description.trim() || undefined,
      });

      if (response.success) {
        setCategories(
          categories.map((c) =>
            c.id === selectedCategory.id ? response.data : c
          )
        );
        setShowEditModal(false);
        setSelectedCategory(null);
        setFormData({ name: '', slug: '', description: '' });
      } else {
        setError(response.message);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update category');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteCategory = async () => {
    if (!selectedCategory) return;

    try {
      setIsSubmitting(true);
      const response = await deleteCategory(selectedCategory.id);
      if (response.success) {
        setCategories(categories.filter((c) => c.id !== selectedCategory.id));
        setShowDeleteModal(false);
        setSelectedCategory(null);
      } else {
        setError(response.message);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete category');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredCategories = categories.filter(
    (category) =>
      category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      category.slug.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (error && isLoading) {
    return (
      <div className='min-h-screen flex items-center justify-center'>
        <div className='text-center'>
          <h1 className='text-2xl font-bold text-red-600 mb-4'>Error</h1>
          <p className='text-gray-600 mb-4'>{error}</p>
          <button
            onClick={() => {
              setError(null);
              fetchCategories();
            }}
            className='bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700'
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-gray-50 dark:bg-gray-900'>
      {/* Header */}
      <div className='bg-white dark:bg-gray-800 shadow-sm border-b dark:border-gray-700'>
        <div className='container mx-auto px-4 py-6'>
          <div className='flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4'>
            <div>
              <h1 className='text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white'>
                Category Management
              </h1>
              <p className='text-gray-600 dark:text-gray-300 mt-1'>
                Organize and manage course categories
              </p>
            </div>
            <button
              onClick={() => {
                setFormData({ name: '', slug: '', description: '' });
                setShowCreateModal(true);
              }}
              className='bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center space-x-2'
            >
              <Plus className='h-4 w-4' />
              <span>Create Category</span>
            </button>
          </div>
        </div>
      </div>

      <div className='container mx-auto px-4 py-8'>
        {/* Search */}
        <div className='bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 sm:p-6 mb-6'>
          <div className='relative'>
            <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5' />
            <input
              type='text'
              placeholder='Search categories...'
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className='w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white'
            />
          </div>
        </div>

        {/* Error Message */}
        {error && !isLoading && (
          <div className='bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg mb-6'>
            {error}
          </div>
        )}

        {/* Categories Grid */}
        <div className='bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden'>
          <div className='p-4 sm:p-6 border-b dark:border-gray-700'>
            <h2 className='text-xl font-bold text-gray-900 dark:text-white'>
              Categories ({filteredCategories.length})
            </h2>
          </div>

          {isLoading ? (
            <div className='p-8 text-center'>
              <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto'></div>
              <p className='text-gray-600 dark:text-gray-300 mt-2'>
                Loading categories...
              </p>
            </div>
          ) : filteredCategories.length === 0 ? (
            <div className='p-8 text-center'>
              <Tag className='h-16 w-16 text-gray-300 dark:text-gray-600 mx-auto mb-4' />
              <h3 className='text-lg font-semibold text-gray-900 dark:text-white mb-2'>
                {searchTerm ? 'No categories found' : 'No categories yet'}
              </h3>
              <p className='text-gray-600 dark:text-gray-300 mb-4'>
                {searchTerm
                  ? 'Try adjusting your search criteria'
                  : 'Get started by creating your first category'}
              </p>
              {!searchTerm && (
                <button
                  onClick={() => {
                    setFormData({ name: '', slug: '', description: '' });
                    setShowCreateModal(true);
                  }}
                  className='bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200'
                >
                  Create Category
                </button>
              )}
            </div>
          ) : (
            <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 p-4 sm:p-6'>
              {filteredCategories.map((category) => (
                <div
                  key={category.id}
                  className='border border-gray-200 dark:border-gray-600 rounded-lg p-4 sm:p-6 hover:shadow-lg transition-shadow duration-200'
                >
                  <div className='flex items-start justify-between mb-4'>
                    <div className='flex items-center space-x-3'>
                      <div className='bg-blue-100 dark:bg-blue-900/30 p-2 rounded-lg'>
                        <Tag className='h-5 w-5 text-blue-600 dark:text-blue-400' />
                      </div>
                      <div className='flex-1 min-w-0'>
                        <h3 className='text-lg font-semibold text-gray-900 dark:text-white truncate'>
                          {category.name}
                        </h3>
                        <p className='text-sm text-gray-500 dark:text-gray-400 truncate'>
                          /{category.slug}
                        </p>
                      </div>
                    </div>
                    <div className='flex items-center space-x-1'>
                      <button
                        onClick={() => handleEditCategory(category)}
                        className='p-2 text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors duration-200'
                      >
                        <Edit className='h-4 w-4' />
                      </button>
                      <button
                        onClick={() => {
                          setSelectedCategory(category);
                          setShowDeleteModal(true);
                        }}
                        className='p-2 text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors duration-200'
                      >
                        <Trash2 className='h-4 w-4' />
                      </button>
                    </div>
                  </div>

                  {category.description && (
                    <p className='text-gray-600 dark:text-gray-300 text-sm mb-4 line-clamp-2'>
                      {category.description}
                    </p>
                  )}

                  <div className='flex items-center justify-between text-sm'>
                    <div className='flex items-center space-x-1 text-gray-500 dark:text-gray-400'>
                      <BookOpen className='h-4 w-4' />
                      <span>{category.courseCount || 0} courses</span>
                    </div>
                    <div className='flex items-center space-x-1 text-gray-500 dark:text-gray-400'>
                      <Calendar className='h-4 w-4' />
                      <span>
                        {new Date(category.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Create Category Modal */}
      {showCreateModal && (
        <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4'>
          <div className='bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full'>
            <h3 className='text-lg font-bold text-gray-900 dark:text-white mb-4'>
              Create New Category
            </h3>
            <div className='space-y-4'>
              <div>
                <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'>
                  Category Name *
                </label>
                <input
                  type='text'
                  value={formData.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  className='w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white'
                  placeholder='Enter category name'
                />
              </div>
              <div>
                <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'>
                  Slug
                </label>
                <input
                  type='text'
                  value={formData.slug}
                  onChange={(e) =>
                    setFormData({ ...formData, slug: e.target.value })
                  }
                  className='w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white'
                  placeholder='category-slug'
                />
              </div>
              <div>
                <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'>
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  rows={3}
                  className='w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white'
                  placeholder='Enter category description'
                />
              </div>
            </div>
            <div className='flex items-center justify-end space-x-3 mt-6'>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setFormData({ name: '', slug: '', description: '' });
                  setError(null);
                }}
                className='px-4 py-2 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100'
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                onClick={handleCreateCategory}
                disabled={isSubmitting}
                className='bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center space-x-2 disabled:opacity-50'
              >
                {isSubmitting ? (
                  <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-white'></div>
                ) : (
                  <Save className='h-4 w-4' />
                )}
                <span>{isSubmitting ? 'Creating...' : 'Create Category'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Category Modal */}
      {showEditModal && selectedCategory && (
        <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4'>
          <div className='bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full'>
            <h3 className='text-lg font-bold text-gray-900 dark:text-white mb-4'>
              Edit Category
            </h3>
            <div className='space-y-4'>
              <div>
                <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'>
                  Category Name *
                </label>
                <input
                  type='text'
                  value={formData.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  className='w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white'
                  placeholder='Enter category name'
                />
              </div>
              <div>
                <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'>
                  Slug
                </label>
                <input
                  type='text'
                  value={formData.slug}
                  onChange={(e) =>
                    setFormData({ ...formData, slug: e.target.value })
                  }
                  className='w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white'
                  placeholder='category-slug'
                />
              </div>
              <div>
                <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'>
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  rows={3}
                  className='w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white'
                  placeholder='Enter category description'
                />
              </div>
            </div>
            <div className='flex items-center justify-end space-x-3 mt-6'>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setSelectedCategory(null);
                  setFormData({ name: '', slug: '', description: '' });
                  setError(null);
                }}
                className='px-4 py-2 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100'
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateCategory}
                disabled={isSubmitting}
                className='bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center space-x-2 disabled:opacity-50'
              >
                {isSubmitting ? (
                  <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-white'></div>
                ) : (
                  <Save className='h-4 w-4' />
                )}
                <span>{isSubmitting ? 'Updating...' : 'Update Category'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedCategory && (
        <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4'>
          <div className='bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full'>
            <h3 className='text-lg font-bold text-gray-900 dark:text-white mb-4'>
              Confirm Delete
            </h3>
            <p className='text-gray-600 dark:text-gray-300 mb-6'>
              Are you sure you want to delete the category "
              {selectedCategory.name}"? This action cannot be undone.
            </p>
            {selectedCategory.courseCount &&
              selectedCategory.courseCount > 0 && (
                <div className='bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3 mb-4'>
                  <p className='text-amber-800 dark:text-amber-300 text-sm'>
                    This category is used by {selectedCategory.courseCount}{' '}
                    course(s). Please remove it from all courses first.
                  </p>
                </div>
              )}
            <div className='flex items-center justify-end space-x-3'>
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setSelectedCategory(null);
                }}
                className='px-4 py-2 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100'
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteCategory}
                disabled={
                  isSubmitting ||
                  (selectedCategory.courseCount &&
                    selectedCategory.courseCount > 0)
                }
                className='bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed'
              >
                {isSubmitting ? 'Deleting...' : 'Delete Category'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CategoryManagement;
