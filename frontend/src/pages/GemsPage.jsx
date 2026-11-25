import React, { useState, useEffect, useMemo } from 'react';
import {
  Search,
  X,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Plus,
} from 'lucide-react';
import { adminService } from '../services/api';
import { SERVER_BASE_URL } from '../utils/config';
import { useToast } from '../context/ToastContext';
import ConfirmModal from '../components/ConfirmModal';
import CustomSelect from '../components/CustomSelect';
import { TableStateRow } from '../components/StateMessage';

const CATEGORIES = [
  'Precious Gem',
  'Semi-Precious',
  'Organic Gem',
  'Rare Collector',
];

const CURRENCIES = ['PKR', 'USD'];

const ALLOWED_IMAGE_MIME = ['image/webp', 'image/png', 'image/jpeg', 'image/jpg'];
const ALLOWED_IMAGE_EXT = /\.(webp|png|jpe?g)$/i;
const MAX_IMAGE_BYTES = 15 * 1024 * 1024;
const PAGE_SIZE = 15;

function resolveGemImage(imageUrl) {
  if (!imageUrl) return '';
  if (imageUrl.startsWith('http') || imageUrl.startsWith('blob:') || imageUrl.startsWith('data:')) {
    return imageUrl;
  }
  return `${SERVER_BASE_URL}${imageUrl}`;
}

/* Add / Edit Gemstone Modal */
function GemModal({ gem, mineralFamilies, onClose, onSaved }) {
  const toast = useToast();
  const isEdit = Boolean(gem?.id);

  const [gemstoneType, setGemstoneType] = useState(gem?.gemstone_type || '');
  const [pricePerCarat, setPricePerCarat] = useState(
    gem?.price_per_carat !== undefined ? String(gem.price_per_carat) : ''
  );
  const [currency, setCurrency] = useState(gem?.currency || 'PKR');
  const [category, setCategory] = useState(gem?.category || 'Precious Gem');

  const initialFamily = gem?.mineral_family || '';
  const isKnownFamily = !initialFamily || mineralFamilies.includes(initialFamily);
  const [selectedFamily, setSelectedFamily] = useState(
    isKnownFamily ? initialFamily : '__custom__'
  );
  const [customFamily, setCustomFamily] = useState(
    isKnownFamily ? '' : initialFamily
  );

  const [mohsHardness, setMohsHardness] = useState(gem?.mohs_hardness || '');
  const [primaryOrigins, setPrimaryOrigins] = useState(gem?.primary_origins || '');

  const [imageFile, setImageFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(resolveGemImage(gem?.image_url));
  const [isDragging, setIsDragging] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    return () => {
      if (previewUrl && previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const applySelectedImage = (file) => {
    if (!file) return false;

    const validMime = ALLOWED_IMAGE_MIME.includes(file.type.toLowerCase());
    const validExt = ALLOWED_IMAGE_EXT.test(file.name);
    if (!validMime && !validExt) {
      toast.error('Please select a WEBP, PNG, or JPG image file.');
      return false;
    }

    if (file.size > MAX_IMAGE_BYTES) {
      toast.error('Image size must be 15MB or less.');
      return false;
    }

    if (previewUrl && previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl);
    }
    setImageFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    return true;
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!applySelectedImage(file)) {
      e.target.value = '';
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDragging) setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const file = e.dataTransfer?.files?.[0];
    if (file) {
      applySelectedImage(file);
    }
  };

  const handleRemoveImage = () => {
    if (previewUrl && previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl);
    }
    setImageFile(null);
    setPreviewUrl('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (saving) return;

    const cleanName = gemstoneType.trim();
    const numericPrice = parseFloat(pricePerCarat);

    if (!cleanName) {
      toast.warning('Please enter a gemstone name.');
      return;
    }
    if (!Number.isFinite(numericPrice) || numericPrice <= 0) {
      toast.warning('Please enter a valid price per carat.');
      return;
    }

    const finalFamily =
      selectedFamily === '__custom__' ? customFamily.trim() : selectedFamily.trim();

    const formData = new FormData();
    formData.append('gemstone_type', cleanName);
    formData.append('price_per_carat', String(numericPrice));
    formData.append('currency', currency);
    formData.append('category', category);
    formData.append('mineral_family', finalFamily);
    formData.append('mohs_hardness', mohsHardness.trim());
    formData.append('primary_origins', primaryOrigins.trim());

    if (imageFile) {
      formData.append('image', imageFile);
    } else if (!previewUrl && gem?.image_url) {
      formData.append('image_url', '');
    }

    setSaving(true);
    try {
      const response = isEdit
        ? await adminService.updatePrice(gem.id, formData)
        : await adminService.createPrice(formData);

      if (response && response.success && response.data) {
        onSaved(response.data, isEdit);
        toast.success(
          isEdit
            ? `${response.data.gemstone_type} updated successfully.`
            : `${response.data.gemstone_type} added to catalog.`
        );
        onClose();
      } else {
        toast.error(response?.message || 'Failed to save gemstone.');
      }
    } catch (error) {
      const message =
        error.response?.data?.message || 'Failed to save gemstone.';
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 font-['Roboto_Condensed',sans-serif] animate-in fade-in duration-150"
      onClick={saving ? undefined : onClose}
    >
      <div
        className="no-scrollbar w-full max-w-xl max-h-[90vh] overflow-y-auto overflow-x-hidden rounded-xl border border-[#E5E7EB] bg-white p-6 shadow-md"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-4">
          <h3 className="text-[17px] font-bold text-[#111827]">
            {isEdit ? 'Edit Gemstone' : 'Add Gemstone'}
          </h3>

          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            aria-label="Close"
            className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-lg bg-white text-[#374151] transition-all duration-150 hover:bg-[#DC2626] hover:text-white disabled:opacity-50"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="pt-5 space-y-4 text-[13px]">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-[12px] font-semibold text-[#374151] mb-1">
                Gemstone Name *
              </label>
              <input
                type="text"
                value={gemstoneType}
                onChange={(e) => setGemstoneType(e.target.value)}
                placeholder="e.g. Tanzanite"
                className="w-full rounded-lg border border-[#E5E7EB] bg-white px-3 py-2 text-[13.5px] text-[#111827] outline-none transition-colors focus:border-[#6B58D6]"
                required
              />
            </div>

            <div>
              <label className="block text-[12px] font-semibold text-[#374151] mb-1">
                Category
              </label>
              <CustomSelect
                value={category}
                onChange={setCategory}
                options={CATEGORIES.map((cat) => ({ value: cat, label: cat }))}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="sm:col-span-2">
              <label className="block text-[12px] font-semibold text-[#374151] mb-1">
                Price per Carat *
              </label>
              <input
                type="number"
                min="1"
                step="any"
                value={pricePerCarat}
                onChange={(e) => setPricePerCarat(e.target.value)}
                placeholder="50000"
                className="w-full rounded-lg border border-[#E5E7EB] bg-white px-3 py-2 text-[13.5px] font-bold text-[#111827] outline-none transition-colors focus:border-[#6B58D6]"
                required
              />
            </div>

            <div>
              <label className="block text-[12px] font-semibold text-[#374151] mb-1">
                Currency
              </label>
              <CustomSelect
                value={currency}
                onChange={setCurrency}
                options={CURRENCIES.map((curr) => ({ value: curr, label: curr }))}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-[12px] font-semibold text-[#374151] mb-1">
                Mineral Family
              </label>
              <CustomSelect
                value={selectedFamily}
                onChange={setSelectedFamily}
                placeholder="Select mineral family"
                options={[
                  { value: '', label: 'Select mineral family' },
                  ...mineralFamilies.map((fam) => ({ value: fam, label: fam })),
                  { value: '__custom__', label: 'Other (Custom)' },
                ]}
              />
              {selectedFamily === '__custom__' && (
                <input
                  type="text"
                  value={customFamily}
                  onChange={(e) => setCustomFamily(e.target.value)}
                  placeholder="Enter mineral family"
                  className="mt-2 w-full rounded-lg border border-[#E5E7EB] bg-white px-3 py-2 text-[13px] text-[#111827] outline-none transition-colors focus:border-[#6B58D6]"
                />
              )}
            </div>

            <div>
              <label className="block text-[12px] font-semibold text-[#374151] mb-1">
                Mohs Hardness
              </label>
              <input
                type="text"
                value={mohsHardness}
                onChange={(e) => setMohsHardness(e.target.value)}
                placeholder="e.g. 7.5 - 8"
                className="w-full rounded-lg border border-[#E5E7EB] bg-white px-3 py-2 text-[13.5px] text-[#111827] outline-none transition-colors focus:border-[#6B58D6]"
              />
            </div>
          </div>

          <div>
            <label className="block text-[12px] font-semibold text-[#374151] mb-1">
              Primary Origins
            </label>
            <input
              type="text"
              value={primaryOrigins}
              onChange={(e) => setPrimaryOrigins(e.target.value)}
              placeholder="e.g. Swat (Pakistan), Colombia, Brazil"
              className="w-full rounded-lg border border-[#E5E7EB] bg-white px-3 py-2 text-[13.5px] text-[#111827] outline-none transition-colors focus:border-[#6B58D6]"
            />
          </div>

          {/* Image Upload at Bottom of Form */}
          <div className="pt-1">
            {previewUrl ? (
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`flex flex-wrap items-center justify-between gap-4 rounded-xl border-2 border-dashed p-4 transition-colors duration-150 ${isDragging
                  ? 'border-[#6B58D6] bg-[#F5F3FF]'
                  : 'border-[#D1D5DB] bg-white hover:border-[#6B58D6] hover:bg-[#F5F3FF]/60'
                  }`}
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg border border-[#E5E7EB] bg-white">
                    <img
                      src={previewUrl}
                      alt="Gemstone preview"
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[13px] font-semibold text-[#111827]">
                      Upload Gemstone Image
                    </div>
                    <div className="mt-0.5 truncate text-[12px] text-[#6B7280]">
                      {imageFile ? imageFile.name : 'Click to upload or drag and drop an image'}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <label className="cursor-pointer rounded-md border border-[#E5E7EB] bg-white px-3 py-1.5 text-[12px] font-semibold text-[#374151] transition-colors hover:border-[#6B58D6] hover:text-[#6B58D6]">
                    <span>Change</span>
                    <input
                      type="file"
                      accept=".webp,.png,.jpg,.jpeg,image/webp,image/png,image/jpeg"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                  </label>
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="cursor-pointer rounded-md border border-[#E5E7EB] bg-white px-3 py-1.5 text-[12px] font-semibold text-[#DC2626] transition-colors hover:border-[#FECACA] hover:bg-[#FEF2F2]"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ) : (
              <label
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-4 py-6 text-center transition-colors duration-150 ${isDragging
                  ? 'border-[#6B58D6] bg-[#F5F3FF]'
                  : 'border-[#D1D5DB] bg-white hover:border-[#6B58D6] hover:bg-[#F5F3FF]/60'
                  }`}
              >
                <span className="text-[13.5px] font-semibold text-[#111827]">
                  Upload Gemstone Image
                </span>
                <span className="mt-1 text-[12px] text-[#6B7280]">
                  Click to upload or drag and drop an image
                </span>
                <input
                  type="file"
                  accept=".webp,.png,.jpg,.jpeg,image/webp,image/png,image/jpeg"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </label>
            )}
          </div>

          <div className="flex justify-end gap-3 border-t border-[#E5E7EB] pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="cursor-pointer rounded-lg border border-[#E5E7EB] bg-white px-4 py-2 text-[13px] font-semibold text-[#374151] transition-colors hover:bg-[#F9FAFB] disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg bg-[#6B58D6] px-4 py-2 text-[13px] font-semibold text-white transition-colors duration-150 hover:bg-[#5845C2] disabled:opacity-60"
            >
              {saving && <Loader2 size={14} className="animate-spin" />}
              <span>{saving ? 'Saving...' : isEdit ? 'Save Changes' : 'Add Gemstone'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function GemsPage() {
  const toast = useToast();
  const [gems, setGems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);

  const [editingGem, setEditingGem] = useState(null);
  const [isAddingGem, setIsAddingGem] = useState(false);
  const [deletingGem, setDeletingGem] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const loadGems = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await adminService.getPrices();
      if (response && response.success && Array.isArray(response.data)) {
        setGems(response.data);
      } else {
        setGems([]);
        setError('Failed to load gemstones.');
      }
    } catch (err) {
      console.error('Failed to load catalog:', err);
      setError('Failed to load gemstones.');
      toast.error('Failed to load gemstone catalog.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGems();
  }, []);

  const mineralFamilies = useMemo(() => {
    const set = new Set();
    for (const g of gems) {
      if (g?.mineral_family) set.add(g.mineral_family.trim());
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [gems]);

  const handleSavedGem = (savedRow, isEdit) => {
    if (isEdit) {
      setGems((prev) => prev.map((g) => (g.id === savedRow.id ? savedRow : g)));
    } else {
      setGems((prev) => [savedRow, ...prev]);
      setCurrentPage(1);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingGem || deleting) return;
    setDeleting(true);
    try {
      const response = await adminService.deletePrice(deletingGem.id);
      if (response && response.success) {
        setGems((prev) => prev.filter((g) => g.id !== deletingGem.id));
        toast.success(`${deletingGem.gemstone_type} deleted from catalog.`);
        setDeletingGem(null);
      } else {
        toast.error(response?.message || 'Failed to delete gemstone.');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete gemstone.');
    } finally {
      setDeleting(false);
    }
  };

  const filteredGems = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    return gems.filter((g) => {
      if (!g) return false;
      const name = String(g.gemstone_type || '').toLowerCase();
      const family = String(g.mineral_family || '').toLowerCase();
      const origins = String(g.primary_origins || '').toLowerCase();

      if (term && !name.includes(term) && !family.includes(term) && !origins.includes(term)) {
        return false;
      }

      if (categoryFilter !== 'all' && (g.category || 'Semi-Precious') !== categoryFilter) {
        return false;
      }
      return true;
    });
  }, [gems, searchTerm, categoryFilter]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, categoryFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredGems.length / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);
  const paginatedGems = useMemo(() => {
    const start = (safePage - 1) * PAGE_SIZE;
    return filteredGems.slice(start, start + PAGE_SIZE);
  }, [filteredGems, safePage]);

  return (
    <div className="space-y-6 font-['Roboto_Condensed',sans-serif]">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-[24px] font-bold tracking-tight text-[#111827]">
          Gemstones & <span className="text-[#6B58D6]">Prices</span>
        </h1>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIsAddingGem(true)}
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-[#6B58D6] px-4 py-2 text-[13px] font-semibold text-white shadow-xs transition-colors duration-150 hover:bg-[#5845C2]"
          >
            <Plus size={15} strokeWidth={2.4} />
            <span>Add Gemstone</span>
          </button>
        </div>
      </div>

      {/* Search & Category Filter */}
      <div className="rounded-xl border border-[#E5E7EB] bg-white p-4 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="group relative flex-1 min-w-[260px] max-w-md">
          <Search
            size={16}
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9CA3AF] transition-colors group-focus-within:text-[#6B58D6]"
          />
          <input
            type="text"
            placeholder="Search by gemstone, mineral family, or origin..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-lg border border-[#E5E7EB] bg-white py-2 pl-10 pr-4 text-[13.5px] text-[#111827] placeholder:text-[#9CA3AF] outline-none transition-colors focus:border-[#6B58D6]"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[12.5px] font-medium text-[#6B7280]">Category:</span>
          <CustomSelect
            value={categoryFilter}
            onChange={setCategoryFilter}
            size="sm"
            align="right"
            className="min-w-[175px]"
            options={[
              { value: 'all', label: `All Categories (${gems.length})` },
              ...CATEGORIES.map((cat) => ({ value: cat, label: cat })),
            ]}
          />
        </div>
      </div>

      {/* Catalog Table */}
      <div className="rounded-xl border border-[#E5E7EB] bg-white shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[13px]">
            <thead className="border-b border-[#E5E7EB] bg-white text-[11.5px] font-semibold uppercase tracking-wider text-[#6B7280]">
              <tr>
                <th className="px-6 py-3.5">Gemstone</th>
                <th className="px-6 py-3.5">Mineral Family</th>
                <th className="px-6 py-3.5">Hardness</th>
                <th className="px-6 py-3.5">Price per Carat</th>
                <th className="px-6 py-3.5">Category</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E7EB] text-[#374151]">
              {loading || error || paginatedGems.length === 0 ? (
                <TableStateRow
                  colSpan={6}
                  loading={loading}
                  error={error}
                  emptyMessage={
                    searchTerm.trim() || (categoryFilter !== 'all' && gems.length > 0)
                      ? 'No results found'
                      : 'No gemstones found'
                  }
                />
              ) : (
                paginatedGems.map((gem) => {
                  const imgUrl = resolveGemImage(gem.image_url);
                  const initials = String(gem.gemstone_type || 'GM')
                    .slice(0, 2)
                    .toUpperCase();

                  return (
                    <tr key={gem.id} className="hover:bg-[#F5F3FF] transition-colors duration-150">
                      <td className="px-6 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 shrink-0 overflow-hidden rounded-lg border border-[#E5E7EB] bg-white flex items-center justify-center text-[11px] font-bold text-[#6B58D6]">
                            {imgUrl ? (
                              <img
                                src={imgUrl}
                                alt={gem.gemstone_type}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              initials
                            )}
                          </div>
                          <div>
                            <div className="font-bold text-[#111827]">
                              {gem.gemstone_type}
                            </div>
                            {gem.primary_origins && (
                              <div className="text-[11px] text-[#6B7280] max-w-[220px] truncate">
                                {gem.primary_origins}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-3.5 text-[#4B5563]">
                        {gem.mineral_family || '—'}
                      </td>

                      <td className="px-6 py-3.5 text-[#4B5563]">
                        {gem.mohs_hardness ? `${gem.mohs_hardness} Mohs` : '—'}
                      </td>

                      <td className="px-6 py-3.5 font-bold text-[#6B58D6]">
                        {gem.currency || 'PKR'} {Number(gem.price_per_carat || 0).toLocaleString()}
                        <span className="text-[10.5px] font-normal text-[#6B7280]">/ct</span>
                      </td>

                      <td className="px-6 py-3.5">
                        <span className="inline-flex rounded-full border border-[#E5E7EB] bg-[#F9FAFB] px-2.5 py-0.5 text-[11px] font-semibold text-[#374151]">
                          {gem.category || 'Semi-Precious'}
                        </span>
                      </td>

                      <td className="px-6 py-3.5 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setEditingGem(gem)}
                            className="cursor-pointer rounded-md border border-[#E5E7EB] bg-white px-3 py-1 text-[12px] font-semibold text-[#374151] transition-colors hover:border-[#6B58D6] hover:text-[#6B58D6]"
                          >
                            Edit
                          </button>

                          <button
                            type="button"
                            onClick={() => setDeletingGem(gem)}
                            className="cursor-pointer rounded-md border border-[#E5E7EB] bg-white px-3 py-1 text-[12px] font-semibold text-[#DC2626] transition-colors hover:border-[#FECACA] hover:bg-[#FEF2F2]"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {filteredGems.length > PAGE_SIZE && (
          <div className="flex items-center justify-between border-t border-[#E5E7EB] bg-white px-6 py-3 text-[12.5px] text-[#6B7280]">
            <span>
              Showing {(safePage - 1) * PAGE_SIZE + 1}–
              {Math.min(safePage * PAGE_SIZE, filteredGems.length)} of{' '}
              {filteredGems.length}
            </span>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={safePage === 1}
                className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-md border border-[#E5E7EB] bg-white text-[#374151] hover:bg-[#F9FAFB] disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronLeft size={15} />
              </button>
              <span className="font-semibold text-[#111827]">
                {safePage} / {totalPages}
              </span>
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={safePage === totalPages}
                className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-md border border-[#E5E7EB] bg-white text-[#374151] hover:bg-[#F9FAFB] disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronRight size={15} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add / Edit Modal */}
      {(isAddingGem || editingGem) && (
        <GemModal
          gem={editingGem}
          mineralFamilies={mineralFamilies}
          onClose={() => {
            setIsAddingGem(false);
            setEditingGem(null);
          }}
          onSaved={handleSavedGem}
        />
      )}

      {/* Delete Confirm Modal */}
      {deletingGem && (
        <ConfirmModal
          isOpen={!!deletingGem}
          title="Delete Gemstone"
          message={`Remove ${deletingGem.gemstone_type} from the gemstone catalog?`}
          confirmText="Delete"
          confirmType="danger"
          loading={deleting}
          onConfirm={handleConfirmDelete}
          onClose={() => setDeletingGem(null)}
        />
      )}
    </div>
  );
}
