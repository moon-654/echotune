import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Plus, Users } from "lucide-react";
import type { TeamEmployees, InsertTeamEmployees } from "@shared/schema";

interface TeamEmployeesEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  teamEmployeesData: TeamEmployees[];
}

export default function TeamEmployeesEditModal({
  isOpen,
  onClose,
  onSave,
  teamEmployeesData
}: TeamEmployeesEditModalProps) {
  const { toast } = useToast();
  const [teamEmployees, setTeamEmployees] = useState<InsertTeamEmployees[]>([]);
  const [loading, setLoading] = useState(false);

  // 기존 데이터 로드
  useEffect(() => {
    if (isOpen && teamEmployeesData) {
      const formattedData = teamEmployeesData.map(item => ({
        year: item.year,
        team: item.team,
        employeeCount: item.employeeCount,
        description: item.description || ""
      }));
      setTeamEmployees(formattedData);
    }
  }, [isOpen, teamEmployeesData]);

  const addTeamEmployee = () => {
    setTeamEmployees([...teamEmployees, {
      year: new Date().getFullYear(),
      team: "",
      employeeCount: 0,
      description: ""
    }]);
  };

  const removeTeamEmployee = (index: number) => {
    setTeamEmployees(teamEmployees.filter((_, i) => i !== index));
  };

  const updateTeamEmployee = (index: number, field: keyof InsertTeamEmployees, value: string | number) => {
    const updated = [...teamEmployees];
    updated[index] = { ...updated[index], [field]: value };
    setTeamEmployees(updated);
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      
      // 모든 기존 데이터 삭제
      await fetch('/api/team-employees?deleteAll=true', {
        method: 'DELETE'
      });

      // 새 데이터 저장
      for (const teamEmployee of teamEmployees) {
        if (teamEmployee.team && teamEmployee.employeeCount > 0) {
          await fetch('/api/team-employees', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(teamEmployee)
          });
        }
      }

      toast({
        title: "성공",
        description: "팀 인원 데이터가 저장되었습니다.",
      });
      
      onSave();
      onClose();
    } catch (error) {
      console.error('팀 인원 데이터 저장 오류:', error);
      toast({
        title: "오류",
        description: "팀 인원 데이터 저장에 실패했습니다.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>팀 인원 데이터 관리</DialogTitle>
          <DialogDescription>
            팀별 인원 데이터를 관리합니다. R&D 인원 자동 계산을 사용하는 경우 이 데이터는 참고용으로만 사용됩니다.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h4 className="font-medium">팀 인원 데이터</h4>
            <Button onClick={addTeamEmployee} size="sm">
              <Plus className="w-4 h-4 mr-2" />
              인원 데이터 추가
            </Button>
          </div>

          <div className="space-y-3">
            {teamEmployees.map((item, index) => (
              <div key={index} className="border rounded-lg p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <h5 className="font-medium">데이터 #{index + 1}</h5>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => removeTeamEmployee(index)}
                  >
                    삭제
                  </Button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <Label htmlFor={`year-${index}`}>연도</Label>
                    <Input
                      id={`year-${index}`}
                      type="number"
                      value={item.year}
                      onChange={(e) => updateTeamEmployee(index, 'year', parseInt(e.target.value))}
                      min="2000"
                      max="2030"
                    />
                  </div>
                  <div>
                    <Label htmlFor={`team-${index}`}>팀명</Label>
                    <Input
                      id={`team-${index}`}
                      value={item.team}
                      onChange={(e) => updateTeamEmployee(index, 'team', e.target.value)}
                      placeholder="예: R&D, 연구개발팀"
                    />
                  </div>
                  <div>
                    <Label htmlFor={`count-${index}`}>인원수</Label>
                    <Input
                      id={`count-${index}`}
                      type="number"
                      value={item.employeeCount}
                      onChange={(e) => updateTeamEmployee(index, 'employeeCount', parseInt(e.target.value))}
                      min="0"
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor={`description-${index}`}>설명</Label>
                  <Textarea
                    id={`description-${index}`}
                    value={item.description}
                    onChange={(e) => updateTeamEmployee(index, 'description', e.target.value)}
                    placeholder="추가 설명 (선택사항)"
                    rows={2}
                  />
                </div>
              </div>
            ))}
          </div>

          {teamEmployees.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>등록된 팀 인원 데이터가 없습니다.</p>
              <p className="text-sm">"인원 데이터 추가" 버튼을 클릭하여 데이터를 추가하세요.</p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            취소
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading ? "저장 중..." : "저장"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
