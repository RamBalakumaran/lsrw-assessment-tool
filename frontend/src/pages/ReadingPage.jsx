import React from 'react';
import ReadingAssessment from '../components/ReadingAssessment';

// Read tenant and passage from query or localStorage
const ReadingPage = ({ location }) => {
  const params = new URLSearchParams(location?.search || window.location.search);
  const tenantId = params.get('tenant_id') || localStorage.getItem('organizationId');
  const passageId = params.get('passage_id');

  if (!tenantId || !passageId) {
    return <div style={{ padding: 20 }}>Missing tenant_id or passage_id in query string.</div>;
  }

  return (
    <div style={{ padding: 20 }}>
      <h1>Reading Assessment</h1>
      <ReadingAssessment tenantId={tenantId} passageId={passageId} />
    </div>
  );
};

export default ReadingPage;