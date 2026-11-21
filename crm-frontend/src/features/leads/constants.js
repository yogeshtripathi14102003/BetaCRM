// export const LEAD_STATUSES = [
//   { value: 'new', label: 'New' },
//   { value: 'Not Interested', label: 'Not Interested' },
//   { value: 'Follow-up', label: 'Follow up' },
//   { value: 'Hot Lead', label: 'Hot Lead' },
//   { value: 'University Issue', label: 'University Issue' },
//   { value: 'Fee Issue', label: 'Fee Issue' },
//   { value: 'Distance Issue', label: 'Distance Issue' },
//   { value: 'Language Issue', label: 'Language Issue' },
//   { value: 'Not Picked', label: 'Not Picked' },
//   { value: 'Admission Done', label: 'Admission Done' },
// ];



// export const LEAD_SOURCES = [
//   { value: 'Website Inquiry', label: 'Website Inquiry' },
//   { value: 'Website Registration', label: 'Website Registration' },
//   { value: 'Manual Upload', label: 'Manual Upload' },
//   { value: 'Imported Lead', label: 'Imported Lead' },
//   { value: 'Referral', label: 'Referral' },
//   { value: 'Campaign', label: 'Campaign' },
//   { value: 'Other', label: 'Other' },
// ];


const DEFAULTS = [
  ['New', 'new', 'blue', true, false, true],
  ['Not Interested', 'not_interested', 'red', false, true, false],
  ['Details Shared', 'details_shared', 'indigo', false, false, false],
  ['Follow-up', 'follow_up', 'amber', false, false, false],
  ['Hot Lead', 'hot_lead', 'amber', false, false, false],
  ['University Issue', 'university_issue', 'slate', false, false, false],
  ['Fee Issue', 'fee_issue', 'slate', false, false, false],
  ['Distance Issue', 'distance_issue', 'slate', false, false, false],
  ['Language Issue', 'language_issue', 'slate', false, false, false],
  ['Not Picked', 'not_picked', 'slate', false, false, false],
  ['Admission Done', 'admission_done', 'green', false, true, true],
];

// ✅ FIXED: values now match DEFAULTS[i][1] (snake_case)
export const LEAD_STATUSES = [
  { value: 'new',              label: 'New' },
  { value: 'not_interested',   label: 'Not Interested' },
  { value: 'details_shared',   label: 'Details Shared' },
  { value: 'follow_up',        label: 'Follow up' },
  { value: 'hot_lead',         label: 'Hot Lead' },
  { value: 'university_issue', label: 'University Issue' },
  { value: 'fee_issue',        label: 'Fee Issue' },
  { value: 'distance_issue',   label: 'Distance Issue' },
  { value: 'language_issue',   label: 'Language Issue' },
  { value: 'not_picked',       label: 'Not Picked' },
  { value: 'admission_done',   label: 'Admission Done' },
];


export const getLeadStatusValue = (lead) => {
  const status = lead?.status;

  if (typeof status === 'string') return status;
  if (typeof status === 'number') return String(status);

  if (status && typeof status === 'object') {
    const key = status.value ?? status.key ?? status.slug ?? status.code;

    if (key) return String(key);

    const name = status.name ?? status.label;

    if (name) {
      return (
        LEAD_STATUSES.find(
          (item) =>
            item.label.toLowerCase() === String(name).toLowerCase()
        )?.value ?? ''
      );
    }
  }

  return String(lead?.status_key ?? lead?.statusKey ?? '');
};


export const LEAD_SOURCES = [
  { value: 'Website Inquiry',      label: 'Website Inquiry' },
  { value: 'Website Registration', label: 'Website Registration' },
  { value: 'Manual Upload',        label: 'Manual Upload' },
  { value: 'Imported Lead',        label: 'Imported Lead' },
  { value: 'Referral',             label: 'Referral' },
  { value: 'Campaign',             label: 'Campaign' },
  { value: 'Other',                label: 'Other' },
];

export const getLeadSourceValue = (lead) => {
  const source = lead?.source;

  if (typeof source === 'string') {
    return source;
  }

  if (typeof source === 'number') {
    return String(source);
  }

  if (source && typeof source === 'object') {
    return String(
      source.label ??
      source.name ??
      source.value ??
      source.key ??
      source.slug ??
      source.code ??
      ''
    );
  }

  return String(
    lead?.source_key ??
    lead?.sourceKey ??
    ''
  );
};