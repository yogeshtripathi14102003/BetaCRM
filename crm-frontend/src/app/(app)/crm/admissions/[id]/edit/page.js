import AdmissionFormPage from "@/features/admission/AdmissionFormPage";

// Next 15+ mein params Promise hota hai; Next 14 ho to: ({ params }) => <AdmissionFormPage id={params.id} />
export default async function Page({ params }) {
  const { id } = await params;
  return <AdmissionFormPage id={id} />;
}
