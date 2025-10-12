import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { User, Eye, Edit } from "lucide-react";
import { useLocation } from "wouter";
import EmployeeEditModal from "./employee-edit-modal";
import type { Employee } from "@shared/schema";

interface EmployeeCardProps {
  employee: Employee;
}

export default function EmployeeCard({ employee }: EmployeeCardProps) {
  const [, setLocation] = useLocation();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  
  const getSkillIndicatorClass = (level?: number) => {
    if (!level) return "bg-gray-400";
    if (level >= 80) return "bg-green-500";
    if (level >= 60) return "bg-yellow-500";
    if (level >= 40) return "bg-red-500";
    return "bg-gray-400";
  };

  // Mock skill level calculation - in real app, this would come from API
  const mockOverallSkill = Math.floor(Math.random() * 40) + 60;
  const mockExperience = employee.hireDate 
    ? Math.floor((new Date().getTime() - new Date(employee.hireDate).getTime()) / (1000 * 60 * 60 * 24 * 365))
    : 0;

  const handleViewEmployee = () => {
    setLocation(`/employees/${employee.id}`);
  };

  const handleEditEmployee = () => {
    setIsEditModalOpen(true);
  };

  return (
    <Card 
      className="hover:shadow-md transition-shadow" 
      data-testid={`employee-card-${employee.id}`}
    >
      <CardContent className="p-6">
        <div className="flex items-center mb-4">
          <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mr-4">
            {employee.photoUrl ? (
              <img 
                src={employee.photoUrl} 
                alt={employee.name} 
                className="w-12 h-12 rounded-full object-cover"
              />
            ) : (
              <User className="w-6 h-6 text-primary" />
            )}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h4 className="font-semibold" data-testid="employee-name">{employee.name}</h4>
              <span 
                className={`px-2 py-1 text-xs rounded-full ${
                  employee.isActive === false 
                    ? 'bg-red-100 text-red-800' 
                    : 'bg-green-100 text-green-800'
                }`}
                data-testid="employee-status"
              >
                {employee.isActive === false ? '비활성' : '활성'}
              </span>
            </div>
            <p className="text-sm text-muted-foreground" data-testid="employee-position">{employee.position}</p>
            <p className="text-xs text-muted-foreground" data-testid="employee-department">{employee.department}</p>
            <p className="text-xs text-muted-foreground" data-testid="employee-number">#{employee.employeeNumber || employee.id}</p>
          </div>
          <div className="ml-auto">
            <div 
              className={`w-3 h-3 rounded-full ${getSkillIndicatorClass(mockOverallSkill)}`} 
              title={`종합 능력치: ${mockOverallSkill}%`}
            ></div>
          </div>
        </div>
        
        <div className="space-y-2 mb-4">
          <div className="flex justify-between text-sm">
            <span>경력:</span>
            <span data-testid="employee-experience">{mockExperience}년</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>이메일:</span>
            <span className="text-xs text-muted-foreground truncate" data-testid="employee-email">
              {employee.email || '-'}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span>입사일:</span>
            <span className="text-xs text-muted-foreground" data-testid="employee-hire-date">
              {employee.hireDate 
                ? new Date(employee.hireDate).toLocaleDateString('ko-KR')
                : '-'
              }
            </span>
          </div>
        </div>

        <div className="flex space-x-2">
          <Button 
            className="flex-1" 
            size="sm"
            onClick={handleViewEmployee}
            data-testid="button-view-employee"
          >
            <Eye className="w-4 h-4 mr-1" />
            상세보기
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleEditEmployee}
            data-testid="button-edit-employee"
          >
            <Edit className="w-4 h-4 mr-1" />
            수정
          </Button>
        </div>
      </CardContent>
      
      {/* Edit Modal */}
      <EmployeeEditModal
        employee={employee}
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
      />
    </Card>
  );
}
