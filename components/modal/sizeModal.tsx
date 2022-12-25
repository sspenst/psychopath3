import React, { useEffect, useState } from 'react';
import LevelDataType from '../../constants/levelDataType';
import Level from '../../models/db/level';
import Modal from '.';

interface SizeModalProps {
  closeModal: () => void;
  isOpen: boolean;
  level: Level;
  setIsDirty: () => void;
  setLevel: (value: React.SetStateAction<Level | undefined>) => void;
}

export default function SizeModal({ closeModal, isOpen, level, setIsDirty, setLevel }: SizeModalProps) {
  const [error, setError] = useState<string>();
  const [heightStr, setHeightStr] = useState('');
  const [widthStr, setWidthStr] = useState('');

  useEffect(() => {
    setHeightStr(level.height.toString());
    setWidthStr(level.width.toString());
  }, [level]);

  function onHeightChange(e: React.ChangeEvent<HTMLInputElement>) {
    setHeightStr(e.currentTarget.value);
  }

  function onWidthChange(e: React.ChangeEvent<HTMLInputElement>) {
    setWidthStr(e.currentTarget.value);
  }

  function onSubmit() {
    setError(undefined);

    const height = Number(heightStr);
    const width = Number(widthStr);

    if (height < 1 || height > 40) {
      setError('Height must be between 1 and 40');

      return;
    } else if (width < 1 || width > 40) {
      setError('Width must be between 1 and 40');

      return;
    }

    setLevel(prevLevel => {
      if (!prevLevel) {
        return prevLevel;
      }

      const level = JSON.parse(JSON.stringify(prevLevel)) as Level;
      const minWidth = Math.min(width, level.width);
      let data = '';

      for (let y = 0; y < height; y++) {
        if (y < level.height) {
          const start = y * (level.width + 1);

          data = data + level.data.substring(start, start + minWidth);
          data = data + Array(width - minWidth + 1).join(LevelDataType.Default);
        } else {
          data = data + Array(width + 1).join(LevelDataType.Default);
        }

        if (y !== height - 1) {
          data = data + '\n';
        }
      }

      // there must always be a start
      if (data.indexOf(LevelDataType.Start) === -1) {
        data = LevelDataType.Start + data.substring(1, data.length);
      }

      // there must always be an end
      if (data.indexOf(LevelDataType.End) === -1) {
        data = data.substring(0, data.length - 1) + LevelDataType.End;
      }

      level.data = data;
      level.height = height;
      level.width = width;

      return level;
    });

    setIsDirty();
    closeModal();
  }

  return (
    <Modal
      closeModal={closeModal}
      isOpen={isOpen}
      onSubmit={onSubmit}
      title={'Set Level Size'}
    >
      <div className='flex flex-col gap-2 w-64 max-w-full'>
        <div className='flex flex-row gap-2 items-center w-full'>
          <label className='font-semibold' htmlFor='width'>Width</label>
          <input
            className='p-1 rounded-md text-black border w-20'
            name='width'
            onChange={onWidthChange}
            pattern='[0-9]*'
            required
            type='number'
            value={widthStr}
          />
        </div>
        <div className='flex flex-row gap-2 items-center w-full'>
          <label className='font-semibold' htmlFor='height'>Height</label>
          <input
            className='p-1 rounded-md text-black border w-20'
            name='height'
            onChange={onHeightChange}
            pattern='[0-9]*'
            required
            type='number'
            value={heightStr}
          />
        </div>
        {!error ? null :
          <div style={{ color: 'var(--color-error)' }}>
            {error}
          </div>
        }
      </div>
    </Modal>
  );
}
