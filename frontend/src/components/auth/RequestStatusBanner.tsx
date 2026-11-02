import { motion } from 'framer-motion';
import { CheckCircle2, Clock, XCircle } from 'lucide-react';
import { ROLE_LABELS } from '../../lib/rbac';
import { AccountRequest } from '../../types/accountRequests';

interface RequestStatusBannerProps {
  request: AccountRequest;
  onUseEmail?: () => void;
}

export function RequestStatusBanner({ request, onUseEmail }: RequestStatusBannerProps) {
  const styles = {
    Pending: { box: 'bg-warning/10 border-warning/30', icon: <Clock size={18} className="text-warning" />, title: 'Your account request is awaiting approval' },
    Approved: { box: 'bg-success/10 border-success/30', icon: <CheckCircle2 size={18} className="text-success" />, title: 'Your account has been approved' },
    Rejected: { box: 'bg-danger/10 border-danger/30', icon: <XCircle size={18} className="text-danger" />, title: 'Your account request was declined' }
  }[request.status];

  return (
    <motion.div
      key={request.status}
      role="status"
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
      className={`flex items-start gap-3 border rounded-xl p-4 ${styles.box}`}>
      
      <div className="mt-0.5 flex-shrink-0">{styles.icon}</div>
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-semibold text-text-primary">{styles.title}</p>
        {request.status === 'Pending' &&
        <p className="text-[12px] text-text-secondary mt-0.5 leading-relaxed">
            Request {request.id} was sent to the system administrator. You’ll be notified here and at {request.email} once it’s reviewed.
          </p>
        }
        {request.status === 'Approved' &&
        <>
            <p className="text-[12px] text-text-secondary mt-0.5 leading-relaxed">
              You can now sign in as {request.assignedRole ? ROLE_LABELS[request.assignedRole] : 'a user'} with {request.email} and the password you chose.
            </p>
            {onUseEmail &&
          <button onClick={onUseEmail} className="mt-2 text-[12px] font-semibold text-primary hover:underline">
                Use this email to sign in
              </button>
          }
          </>
        }
        {request.status === 'Rejected' &&
        <p className="text-[12px] text-text-secondary mt-0.5 leading-relaxed">
            {request.rejectionReason || 'The administrator could not verify your details.'} Contact your institution’s focal point if you think this is a mistake.
          </p>
        }
      </div>
    </motion.div>);

}