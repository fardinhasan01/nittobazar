import React, { useId, useRef } from 'react';
import { Camera, ImagePlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface MobileFilePickerProps {
  accept: string;
  multiple?: boolean;
  onFiles: (files: File[]) => void;
  disabled?: boolean;
  label: string;
  hint?: string;
  showCamera?: boolean;
  className?: string;
}

/**
 * Android WebView-friendly file picker: hidden native input + large tap targets.
 * Resets input value after each selection so the same file can be chosen again.
 */
const MobileFilePicker: React.FC<MobileFilePickerProps> = ({
  accept,
  multiple = false,
  onFiles,
  disabled = false,
  label,
  hint,
  showCamera = accept.includes('image'),
  className,
}) => {
  const id = useId();
  const galleryRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const list = e.target.files;
    if (list?.length) {
      onFiles(Array.from(list));
    }
    e.target.value = '';
  };

  return (
    <div className={cn('space-y-2', className)}>
      <p className="text-sm font-medium text-gray-700">{label}</p>
      {hint && <p className="text-xs text-gray-500">{hint}</p>}

      <input
        id={`${id}-gallery`}
        ref={galleryRef}
        type="file"
        accept={accept}
        multiple={multiple}
        className="sr-only"
        disabled={disabled}
        onChange={handleChange}
      />
      {showCamera && (
        <input
          id={`${id}-camera`}
          ref={cameraRef}
          type="file"
          accept={accept}
          capture="environment"
          className="sr-only"
          disabled={disabled}
          onChange={handleChange}
        />
      )}

      <div className="flex flex-col sm:flex-row gap-2">
        <Button
          type="button"
          variant="outline"
          disabled={disabled}
          className="min-h-11 flex-1 touch-manipulation"
          onClick={() => galleryRef.current?.click()}
        >
          <ImagePlus className="w-4 h-4 mr-2 shrink-0" />
          Choose from gallery
        </Button>
        {showCamera && (
          <Button
            type="button"
            variant="outline"
            disabled={disabled}
            className="min-h-11 flex-1 touch-manipulation"
            onClick={() => cameraRef.current?.click()}
          >
            <Camera className="w-4 h-4 mr-2 shrink-0" />
            Take photo
          </Button>
        )}
      </div>
    </div>
  );
};

export default MobileFilePicker;
