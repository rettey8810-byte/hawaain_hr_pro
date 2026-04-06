import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  Edit2, 
  FileText, 
  Briefcase, 
  Plane, 
  HeartPulse,
  Calendar,
  Mail,
  Phone,
  MapPin,
  Building2
} from 'lucide-react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useFirestore } from '../hooks/useFirestore';
import { useAuth } from '../contexts/AuthContext';
import { formatDate, getDocumentStatus, calculateDaysRemaining } from '../utils/helpers';
import { differenceInDays, parseISO } from 'date-fns';

function DocumentCard({ title, icon: Icon, documents, type, employeeId }) {
  const typePaths = {
    passport: '/passports',
    visa: '/visas',
    'work-permit': '/work-permits',
    medical: '/medical'
  };

  const latestDoc = documents?.sort((a, b) => 
    new Date(b.createdAt) - new Date(a.createdAt)
  )[0];

  const status = latestDoc ? getDocumentStatus(latestDoc.expiryDate) : null;
  const daysRemaining = latestDoc ? calculateDaysRemaining(latestDoc.expiryDate) : null;

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center">
          <Icon className="h-5 w-5 text-blue-600 mr-2" />
          <h4 className="font-medium text-gray-900">{title}</h4>
        </div>
        <Link 
          to={`${typePaths[type]}?employee=${employeeId}`}
          className="text-sm text-blue-600 hover:text-blue-800"
        >
          View All
        </Link>
      </div>
      
      {latestDoc ? (
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Status:</span>
            <span className={`px-2 py-0.5 rounded text-xs font-medium ${
              status?.color === 'green' ? 'bg-green-100 text-green-800' :
              status?.color === 'yellow' ? 'bg-yellow-100 text-yellow-800' :
              status?.color === 'red' ? 'bg-red-100 text-red-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {status?.label || 'Unknown'}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Expires:</span>
            <span className={daysRemaining <= 30 ? 'text-red-600 font-medium' : 'text-gray-900'}>
              {formatDate(latestDoc.expiryDate)}
            </span>
          </div>
          {daysRemaining !== null && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Days Left:</span>
              <span className={daysRemaining <= 30 ? 'text-red-600 font-medium' : 'text-gray-900'}>
                {daysRemaining > 0 ? `${daysRemaining} days` : 'Expired'}
              </span>
            </div>
          )}
        </div>
      ) : (
        <p className="text-sm text-gray-500 italic">No documents found</p>
      )}
    </div>
  );
}

export default function EmployeeDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isHR } = useAuth();
  const [employee, setEmployee] = useState(null);
  const [documents, setDocuments] = useState({
    passports: [],
    visas: [],
    workPermits: [],
    medicals: []
  });
  const [loading, setLoading] = useState(true);

  const { getDocumentsByEmployee } = useFirestore('employees');
  const { getDocumentsByEmployee: getPassports } = useFirestore('passports');
  const { getDocumentsByEmployee: getVisas } = useFirestore('visas');
  const { getDocumentsByEmployee: getWorkPermits } = useFirestore('workPermits');
  const { getDocumentsByEmployee: getMedicals } = useFirestore('medicals');

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      
      // Fetch single employee by ID using Firebase query
      try {
        const employeeQuery = query(
          collection(db, 'employees'),
          where('__name__', '==', id)
        );
        const employeeSnap = await getDocs(employeeQuery);
        if (!employeeSnap.empty) {
          setEmployee({ id: employeeSnap.docs[0].id, ...employeeSnap.docs[0].data() });
        } else {
          console.log('Employee not found with ID:', id);
          setEmployee(null);
        }
      } catch (err) {
        console.error('Error fetching employee:', err);
        setEmployee(null);
      } finally {
        setLoading(false);
      }
      
      const unsubPassports = getPassports(id);
      const unsubVisas = getVisas(id);
      const unsubPermits = getWorkPermits(id);
      const unsubMedicals = getMedicals(id);

      return () => {
        unsubPassports?.();
        unsubVisas?.();
        unsubPermits?.();
        unsubMedicals?.();
      };
    };

    loadData();
  }, [id]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Employee not found</p>
        <Link to="/employees" className="text-blue-600 hover:text-blue-800 mt-2 inline-block">
          Back to Employees
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="md:flex md:items-center md:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex items-center">
            <Link to="/employees" className="text-gray-400 hover:text-gray-600 mr-4">
              <ArrowLeft className="h-6 w-6" />
            </Link>
            <div>
              <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
                {employee.name}
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                {employee.position} • {employee.department}
              </p>
            </div>
          </div>
        </div>
        <div className="mt-4 flex md:ml-4 md:mt-0">
          {isHR() && (
            <Link
              to={`/employees/${id}/edit`}
              className="inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
            >
              <Edit2 className="h-4 w-4 mr-2" />
              Edit
            </Link>
          )}
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <Mail className="h-5 w-5 text-gray-400 mr-3" />
            <div>
              <p className="text-sm text-gray-500">Email</p>
              <p className="text-sm font-medium text-gray-900">{employee.email}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <Phone className="h-5 w-5 text-gray-400 mr-3" />
            <div>
              <p className="text-sm text-gray-500">Phone</p>
              <p className="text-sm font-medium text-gray-900">{employee.phone || '-'}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <Building2 className="h-5 w-5 text-gray-400 mr-3" />
            <div>
              <p className="text-sm text-gray-500">Department</p>
              <p className="text-sm font-medium text-gray-900">{employee.department || '-'}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <Calendar className="h-5 w-5 text-gray-400 mr-3" />
            <div>
              <p className="text-sm text-gray-500">Join Date</p>
              <p className="text-sm font-medium text-gray-900">{formatDate(employee.joinDate)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Documents Section */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Documents</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <DocumentCard
            title="Passport"
            icon={FileText}
            documents={documents.passports}
            type="passport"
            employeeId={id}
          />
          <DocumentCard
            title="Visa"
            icon={Plane}
            documents={documents.visas}
            type="visa"
            employeeId={id}
          />
          <DocumentCard
            title="Work Permit"
            icon={Briefcase}
            documents={documents.workPermits}
            type="work-permit"
            employeeId={id}
          />
          <DocumentCard
            title="Medical Record"
            icon={HeartPulse}
            documents={documents.medicals}
            type="medical"
            employeeId={id}
          />
        </div>
      </div>
    </div>
  );
}
