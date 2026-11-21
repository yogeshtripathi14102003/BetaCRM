import AdmissionDetailPage from  "@/features/admission/AdmissionDetailPage";

export default async function Page({ params }) {
  const { id } = await params;

  return <AdmissionDetailPage id={id} />;
}