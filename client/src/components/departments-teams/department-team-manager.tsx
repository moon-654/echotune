import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, Building2, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { DepartmentTeamManager, type Department, type Team } from "@/lib/departments-teams";

export default function DepartmentTeamManagement() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [isAddDepartmentOpen, setIsAddDepartmentOpen] = useState(false);
  const [isAddTeamOpen, setIsAddTeamOpen] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const { toast } = useToast();

  // 폼 데이터
  const [departmentForm, setDepartmentForm] = useState({ code: "", name: "" });
  const [teamForm, setTeamForm] = useState({ code: "", name: "", departmentCode: "" });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const data = await DepartmentTeamManager.getStoredData();
    setDepartments(data.departments);
    setTeams(data.teams);
  };

  const handleAddDepartment = () => {
    try {
      DepartmentTeamManager.addDepartment(departmentForm.code, departmentForm.name);
      loadData();
      setIsAddDepartmentOpen(false);
      setDepartmentForm({ code: "", name: "" });
      toast({ title: "부서가 추가되었습니다." });
    } catch (error) {
      toast({
        title: "부서 추가 실패",
        description: error instanceof Error ? error.message : "알 수 없는 오류",
        variant: "destructive"
      });
    }
  };

  const handleAddTeam = () => {
    try {
      DepartmentTeamManager.addTeam(teamForm.code, teamForm.name, teamForm.departmentCode);
      loadData();
      setIsAddTeamOpen(false);
      setTeamForm({ code: "", name: "", departmentCode: "" });
      toast({ title: "팀이 추가되었습니다." });
    } catch (error) {
      toast({
        title: "팀 추가 실패",
        description: error instanceof Error ? error.message : "알 수 없는 오류",
        variant: "destructive"
      });
    }
  };

  const handleDeleteDepartment = (code: string) => {
    if (confirm('정말로 이 부서를 삭제하시겠습니까? 소속 팀들도 함께 삭제됩니다.')) {
      try {
        DepartmentTeamManager.removeDepartment(code);
        loadData();
        toast({ title: "부서가 삭제되었습니다." });
      } catch (error) {
        toast({
          title: "부서 삭제 실패",
          description: error instanceof Error ? error.message : "알 수 없는 오류",
          variant: "destructive"
        });
      }
    }
  };

  const handleDeleteTeam = (code: string) => {
    if (confirm('정말로 이 팀을 삭제하시겠습니까?')) {
      try {
        DepartmentTeamManager.removeTeam(code);
        loadData();
        toast({ title: "팀이 삭제되었습니다." });
      } catch (error) {
        toast({
          title: "팀 삭제 실패",
          description: error instanceof Error ? error.message : "알 수 없는 오류",
          variant: "destructive"
        });
      }
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">부서 및 팀 관리</h1>
          <p className="text-muted-foreground">조직 구조를 관리합니다</p>
        </div>
        <div className="flex space-x-2">
          <Button onClick={() => setIsAddDepartmentOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            부서 추가
          </Button>
          <Button onClick={() => setIsAddTeamOpen(true)} variant="outline">
            <Plus className="w-4 h-4 mr-2" />
            팀 추가
          </Button>
        </div>
      </div>

      {/* 부서 목록 */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold flex items-center">
          <Building2 className="w-5 h-5 mr-2" />
          부서 목록 ({departments.length}개)
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {departments.map(dept => (
            <Card key={dept.code}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{dept.name}</CardTitle>
                  <Badge variant="outline">{dept.code}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">
                    {teams.filter(t => t.departmentCode === dept.code).length}개 팀
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteDepartment(dept.code)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* 팀 목록 */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold flex items-center">
          <Users className="w-5 h-5 mr-2" />
          팀 목록 ({teams.length}개)
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {teams.map(team => (
            <Card key={team.code}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{team.name}</CardTitle>
                  <Badge variant="outline">{team.code}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">
                    {departments.find(d => d.code === team.departmentCode)?.name}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteTeam(team.code)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* 부서 추가 모달 */}
      <Dialog open={isAddDepartmentOpen} onOpenChange={setIsAddDepartmentOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>새 부서 추가</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="deptCode">부서코드</Label>
              <Input
                id="deptCode"
                value={departmentForm.code}
                onChange={(e) => setDepartmentForm(prev => ({ ...prev, code: e.target.value }))}
                placeholder="예: RND, DEV"
              />
            </div>
            <div>
              <Label htmlFor="deptName">부서명</Label>
              <Input
                id="deptName"
                value={departmentForm.name}
                onChange={(e) => setDepartmentForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="예: 기술연구소"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDepartmentOpen(false)}>
              취소
            </Button>
            <Button onClick={handleAddDepartment}>
              추가
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 팀 추가 모달 */}
      <Dialog open={isAddTeamOpen} onOpenChange={setIsAddTeamOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>새 팀 추가</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="teamCode">팀코드</Label>
              <Input
                id="teamCode"
                value={teamForm.code}
                onChange={(e) => setTeamForm(prev => ({ ...prev, code: e.target.value }))}
                placeholder="예: RND01, DEV01"
              />
            </div>
            <div>
              <Label htmlFor="teamName">팀명</Label>
              <Input
                id="teamName"
                value={teamForm.name}
                onChange={(e) => setTeamForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="예: 연구개발팀"
              />
            </div>
            <div>
              <Label htmlFor="departmentCode">소속 부서</Label>
              <Select
                value={teamForm.departmentCode}
                onValueChange={(value) => setTeamForm(prev => ({ ...prev, departmentCode: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="부서 선택" />
                </SelectTrigger>
                <SelectContent>
                  {departments.map(dept => (
                    <SelectItem key={dept.code} value={dept.code}>
                      {dept.name} ({dept.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddTeamOpen(false)}>
              취소
            </Button>
            <Button onClick={handleAddTeam}>
              추가
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

