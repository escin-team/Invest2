import type { InvestmentProduct } from '@/src/lib/dashboard-schema';

const PRODUCT_IMAGE_MAP: Record<string, string> = {
  'PRD-01': '/assets/images/product_solar_energy_1794705588627.jpg',
  'PRD-02': '/assets/images/product_cold_logistics_1794705587811.jpg',
  'PRD-03': '/assets/images/product_umkm_digital_1794705590783.jpg',
  'PRD-04': '/assets/images/product_ev_fleet_1794705588861.jpg',
  'PRD-05': '/assets/images/product_data_center_1794705590000.jpg',
  'PRD-06': '/assets/images/product_hydroponic_farm_1794705590697.jpg',
};

const PRODUCT_IMAGE_BY_PATH: Record<string, string> = {
  '/src/assets/images/product_solar_energy_1794705588627.jpg':
    '/assets/images/product_solar_energy_1794705588627.jpg',
  '/src/assets/images/product_cold_logistics_1794705587811.jpg':
    '/assets/images/product_cold_logistics_1794705587811.jpg',
  '/src/assets/images/product_umkm_digital_1794705590783.jpg':
    '/assets/images/product_umkm_digital_1794705590783.jpg',
  '/src/assets/images/product_ev_fleet_1794705588861.jpg':
    '/assets/images/product_ev_fleet_1794705588861.jpg',
  '/src/assets/images/product_data_center_1794705590000.jpg':
    '/assets/images/product_data_center_1794705590000.jpg',
  '/src/assets/images/product_hydroponic_farm_1794705590697.jpg':
    '/assets/images/product_hydroponic_farm_1794705590697.jpg',
};

export function resolveProductImageSrc(
  product?: Pick<InvestmentProduct, 'id' | 'imageUrl'> | null
): string {
  if (!product || !product.imageUrl) {
    return '';
  }
  return (
    PRODUCT_IMAGE_BY_PATH[product.imageUrl] ??
    PRODUCT_IMAGE_MAP[product.id] ??
    product.imageUrl ??
    ''
  );
}
