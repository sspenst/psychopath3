import Link from 'next/link';
import React from 'react';
import Dimensions from '../constants/dimensions';
import getProfileSlug from '../helpers/getProfileSlug';
import User from '../models/db/user';
import Avatar from './avatar';

interface FormattedUserProps {
  noLinks?: boolean;
  onClick?: () => void;
  rating?: number;
  size?: number;
  user?: User;
}

export default function FormattedUser({ noLinks, onClick, rating, size, user }: FormattedUserProps) {
  if (!user) {
    return (
      <div className={'flex items-center gap-2'}>
        Someone
      </div>
    );
  }

  return (
    <div className={'flex items-center gap-2'}>
      {noLinks ?
        <>
          <Avatar size={size ?? Dimensions.AvatarSize} user={user} />
          <span>{user.name}</span>
        </>
        :
        <>
          <Link href={getProfileSlug(user)} passHref>
            <Avatar size={size ?? Dimensions.AvatarSize} user={user} />
          </Link>
          <Link
            className='font-bold underline'
            href={getProfileSlug(user)}
            onClick={onClick}
            passHref
          >
            <span>{user.name}</span>
          </Link>
        </>
      }
      {rating && <span className='text-sm opacity-70'>{`(${Math.round(rating)})`}</span>}
    </div>
  );
}
