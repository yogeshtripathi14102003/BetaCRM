import Spinner from '@/components/ui/Spinner';

// Next ise automatically Suspense boundary banata hai (useSearchParams wale pages ke liye bhi zaroori)
export default function Loading() {
  return <Spinner />;
}
