'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/Dialog';
import { Input, Button } from '@/components/ui';
import * as Icons from 'lucide-react';

const ICONS_LIST = [
  'Users',
  'Bus',
  'Percent',
  'Ticket',
  'Home',
  'Tag',
  'BookOpen',
  'Cake',
  'GraduationCap',
  'Banknote',
  'Gift',
  'DollarSign',
  'Wallet',
  'Umbrella',
  'Radio',
  'Utensils',
];

export default function CategoryModal({ isOpen, onClose, category, onSave }) {
  const [name, setName] = useState('');
  const [selectedIcon, setSelectedIcon] = useState(ICONS_LIST[0]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (category) {
      setName(category.name || '');
      setSelectedIcon(category.icon || ICONS_LIST[0]);
    } else {
      setName('');
      setSelectedIcon(ICONS_LIST[0]);
    }
  }, [category, isOpen]);

  const handleSave = async () => {
    setIsSaving(true);
    await onSave({
      _id: category?._id,
      name,
      icon: selectedIcon,
      type: category?.type || 'expense', // default to expense if new, though we should pass it
      color: category?.color || '#000000',
    });
    setIsSaving(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md bg-stone-50 border-none rounded-xl">
        <DialogHeader>
          <DialogTitle className="text-center text-[#2A5246] font-semibold text-lg">
            {category ? 'Edit category' : 'New category'}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="flex items-center space-x-3">
            <label className="text-sm font-medium text-[#2A5246] min-w-[40px]">Name</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="flex-1 border-[#A8BDB5] bg-stone-100/50 rounded-lg text-black focus:border-[#2A5246] focus:ring-[#2A5246]"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-[#2A5246]">Icon</label>
            <div className="grid grid-cols-8 gap-2 border border-[#A8BDB5] p-3 rounded-xl bg-white">
              {ICONS_LIST.map((iconName) => {
                const IconComponent = Icons[iconName];
                const isSelected = selectedIcon === iconName;
                return (
                  <button
                    key={iconName}
                    type="button"
                    onClick={() => setSelectedIcon(iconName)}
                    className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                      isSelected
                        ? 'bg-[#2A5246] text-white ring-2 ring-offset-1 ring-[#2A5246]'
                        : 'bg-gray-100 text-[#2A5246] hover:bg-gray-200'
                    }`}
                  >
                    {IconComponent && (
                      <IconComponent size={16} strokeWidth={isSelected ? 2.5 : 2} />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
        <DialogFooter className="flex justify-center sm:justify-center gap-4 mt-2 border-none">
          <Button
            variant="outline"
            onClick={onClose}
            className="border-[#2A5246] text-[#2A5246] hover:bg-[#2A5246] hover:text-white rounded-md px-6 font-semibold"
            disabled={isSaving}
          >
            CANCEL
          </Button>
          <Button
            onClick={handleSave}
            className="border-[#2A5246] bg-white text-[#2A5246] hover:bg-[#2A5246] hover:text-white border rounded-md px-8 font-semibold"
            disabled={!name.trim() || isSaving}
          >
            SAVE
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
