import { getRouteMetadata } from '@/src/utils/serverSeo'

﻿import { Favorites } from '../../src/views/Favorites'

export async function generateMetadata() {
  return getRouteMetadata(
    '/favorites',
    'Đề thi yêu thích | VNDocs',
    'Danh sách đề thi bạn đã yêu thích trên VNDocs. Ôn luyện dễ dàng hơn với kho đề thi được lưu riêng cho bạn.'
  )
}

export default function FavoritesPage() {
  return <Favorites />
}

