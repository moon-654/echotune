import { useState } from "react";
import { X, Maximize2, Minimize2, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import EmployeeDetail from "@/pages/employee-detail";

interface EmployeeInfoPanelProps {
  employeeId: string | null;
  isOpen: boolean;
  onClose: () => void;
  panelWidth: number;
  onWidthChange: (width: number) => void;
}

export default function EmployeeInfoPanel({ 
  employeeId, 
  isOpen, 
  onClose, 
  panelWidth, 
  onWidthChange 
}: EmployeeInfoPanelProps) {
  const [isMaximized, setIsMaximized] = useState(false);

  const handleMaximize = () => {
    if (isMaximized) {
      onWidthChange(50); // 기본 크기로 복원
    } else {
      onWidthChange(100); // 전체 화면
    }
    setIsMaximized(!isMaximized);
  };

  if (!isOpen || !employeeId) return null;

  return (
    <div 
      className={`fixed top-0 right-0 h-full bg-white shadow-2xl z-50 transition-all duration-300 ease-in-out ${
        isOpen ? 'translate-x-0' : 'translate-x-full'
      }`}
      style={{ width: `${panelWidth}%` }}
    >
      {/* 헤더 */}
      <div className="flex items-center justify-between p-4 border-b bg-gray-50">
        <div className="flex items-center gap-2">
          <User className="w-5 h-5 text-blue-600" />
          <h2 className="text-lg font-semibold">직원 정보</h2>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleMaximize}
            className="p-2"
          >
            {isMaximized ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="p-2"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* 내용 - 기존 직원 상세보기 페이지를 그대로 사용 */}
      <div className="h-full overflow-y-auto">
        {employeeId ? (
          <div className="p-6">
            <EmployeeDetail employeeId={employeeId} />
          </div>
        ) : (
          <div className="p-6 text-center">
            <p className="text-gray-500">직원을 선택해주세요.</p>
          </div>
        )}
      </div>
    </div>
  );
}
