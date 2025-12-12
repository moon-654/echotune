import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trash2, Plus, Edit, Save, X } from "lucide-react";
import { DepartmentTeamManager, type Department, type Team } from "@/lib/departments-teams";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface DepartmentTeamManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function DepartmentTeamManagerModal({ isOpen, onClose }: DepartmentTeamManagerModalProps) {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [activeTab, setActiveTab] = useState("departments");

  // 새 부서/팀 추가 상태
  const [newDepartment, setNewDepartment] = useState({ code: "", name: "" });
  const [newTeam, setNewTeam] = useState({ code: "", name: "", departmentCode: "" });

  // 편집 상태
  const [editingDepartment, setEditingDepartment] = useState<string | null>(null);
  const [editingTeam, setEditingTeam] = useState<string | null>(null);
  const [editDepartment, setEditDepartment] = useState({ code: "", name: "" });
  const [editTeam, setEditTeam] = useState({ code: "", name: "", departmentCode: "" });

  // 삭제 확인 다이얼로그 상태
  const [deleteData, setDeleteData] = useState<{ type: 'department' | 'team', code: string } | null>(null);

  // 데이터 로드
  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  const loadData = async () => {
    try {
      const [allDepartments, allTeams] = await Promise.all([
        DepartmentTeamManager.getAllDepartments(),
        DepartmentTeamManager.getAllTeams()
      ]);
      setDepartments(allDepartments);
      setTeams(allTeams);
    } catch (error) {
      console.error('부서/팀 데이터 로드 실패:', error);
    }
  };

  // 부서 추가
  const handleAddDepartment = async () => {
    if (!newDepartment.code || !newDepartment.name) {
      alert("부서 코드와 이름을 입력해주세요.");
      return;
    }

    try {
      await DepartmentTeamManager.addDepartment(newDepartment.code, newDepartment.name);
      setNewDepartment({ code: "", name: "" });
      await loadData();
      alert("부서가 추가되었습니다.");
    } catch (error) {
      alert(error instanceof Error ? error.message : "부서 추가에 실패했습니다.");
    }
  };

  // 팀 추가
  const handleAddTeam = async () => {
    if (!newTeam.code || !newTeam.name || !newTeam.departmentCode) {
      alert("팀 코드, 이름, 부서를 모두 입력해주세요.");
      return;
    }

    try {
      await DepartmentTeamManager.addTeam(newTeam.code, newTeam.name, newTeam.departmentCode);
      setNewTeam({ code: "", name: "", departmentCode: "" });
      await loadData();
      alert("팀이 추가되었습니다.");
    } catch (error) {
      alert(error instanceof Error ? error.message : "팀 추가에 실패했습니다.");
    }
  };

  // 부서 편집 시작
  const handleEditDepartment = (department: Department) => {
    setEditingDepartment(department.code);
    setEditDepartment({ code: department.code, name: department.name });
  };

  // 팀 편집 시작
  const handleEditTeam = (team: Team) => {
    setEditingTeam(team.code);
    setEditTeam({ code: team.code, name: team.name, departmentCode: team.departmentCode });
  };

  // 부서 편집 저장
  const handleSaveDepartment = async () => {
    try {
      await DepartmentTeamManager.updateDepartment(editDepartment.code, editDepartment.name);
      setEditingDepartment(null);
      await loadData();
      alert("부서가 수정되었습니다.");
    } catch (error) {
      alert(error instanceof Error ? error.message : "부서 수정에 실패했습니다.");
    }
  };

  // 팀 편집 저장
  const handleSaveTeam = async () => {
    try {
      await DepartmentTeamManager.updateTeam(editTeam.code, editTeam.name, editTeam.departmentCode);
      setEditingTeam(null);
      await loadData();
      alert("팀이 수정되었습니다.");
    } catch (error) {
      alert(error instanceof Error ? error.message : "팀 수정에 실패했습니다.");
    }
  };

  // 삭제 확인 처리
  const confirmDelete = async () => {
    if (!deleteData) return;

    try {
      if (deleteData.type === 'department') {
        await DepartmentTeamManager.removeDepartment(deleteData.code);
      } else {
        await DepartmentTeamManager.removeTeam(deleteData.code);
      }

      await loadData();
    } catch (error) {
      alert(error instanceof Error ? error.message : "삭제에 실패했습니다.");
    } finally {
      setDeleteData(null);
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>부서/팀 관리</DialogTitle>
          </DialogHeader>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="departments">부서 관리</TabsTrigger>
              <TabsTrigger value="teams">팀 관리</TabsTrigger>
            </TabsList>

            {/* 부서 관리 탭 */}
            <TabsContent value="departments" className="space-y-4">
              {/* 새 부서 추가 */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Plus className="w-5 h-5 mr-2" />
                    새 부서 추가
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="deptCode">부서 코드</Label>
                      <Input
                        id="deptCode"
                        value={newDepartment.code}
                        onChange={(e) => setNewDepartment(prev => ({ ...prev, code: e.target.value }))}
                        placeholder="예: RND"
                      />
                    </div>
                    <div>
                      <Label htmlFor="deptName">부서 이름</Label>
                      <Input
                        id="deptName"
                        value={newDepartment.name}
                        onChange={(e) => setNewDepartment(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="예: 기술연구소"
                      />
                    </div>
                    <div className="flex items-end">
                      <Button onClick={handleAddDepartment} className="w-full">
                        부서 추가
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* 부서 목록 */}
              <Card>
                <CardHeader>
                  <CardTitle>부서 목록</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {departments.map((dept) => (
                      <div key={dept.code} className="flex items-center justify-between p-3 border rounded-lg">
                        {editingDepartment === dept.code ? (
                          <div className="flex items-center space-x-2 flex-1">
                            <Input
                              value={editDepartment.code}
                              onChange={(e) => setEditDepartment(prev => ({ ...prev, code: e.target.value }))}
                              className="w-24"
                            />
                            <Input
                              value={editDepartment.name}
                              onChange={(e) => setEditDepartment(prev => ({ ...prev, name: e.target.value }))}
                              className="flex-1"
                            />
                            <Button size="sm" onClick={handleSaveDepartment}>
                              <Save className="w-4 h-4" />
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => setEditingDepartment(null)}>
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        ) : (
                          <>
                            <div className="flex-1">
                              <div className="font-medium">{dept.name}</div>
                              <div className="text-sm text-muted-foreground">{dept.code}</div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Badge variant="outline">
                                {teams.filter(t => t.departmentCode === dept.code).length}개 팀
                              </Badge>
                              <Button size="sm" variant="outline" onClick={() => handleEditDepartment(dept)}>
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => setDeleteData({ type: 'department', code: dept.code })}>
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* 팀 관리 탭 */}
            <TabsContent value="teams" className="space-y-4">
              {/* 새 팀 추가 */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Plus className="w-5 h-5 mr-2" />
                    새 팀 추가
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <Label htmlFor="teamCode">팀 코드</Label>
                      <Input
                        id="teamCode"
                        value={newTeam.code}
                        onChange={(e) => setNewTeam(prev => ({ ...prev, code: e.target.value }))}
                        placeholder="예: RND01"
                      />
                    </div>
                    <div>
                      <Label htmlFor="teamName">팀 이름</Label>
                      <Input
                        id="teamName"
                        value={newTeam.name}
                        onChange={(e) => setNewTeam(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="예: 연구기획팀"
                      />
                    </div>
                    <div>
                      <Label htmlFor="teamDept">부서</Label>
                      <Select
                        value={newTeam.departmentCode}
                        onValueChange={(value) => setNewTeam(prev => ({ ...prev, departmentCode: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="부서 선택" />
                        </SelectTrigger>
                        <SelectContent>
                          {departments.map((dept) => (
                            <SelectItem key={dept.code} value={dept.code}>
                              {dept.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-end">
                      <Button onClick={handleAddTeam} className="w-full">
                        팀 추가
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* 팀 목록 */}
              <Card>
                <CardHeader>
                  <CardTitle>팀 목록</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {teams.map((team) => (
                      <div key={team.code} className="flex items-center justify-between p-3 border rounded-lg">
                        {editingTeam === team.code ? (
                          <div className="flex items-center space-x-2 flex-1">
                            <Input
                              value={editTeam.code}
                              onChange={(e) => setEditTeam(prev => ({ ...prev, code: e.target.value }))}
                              className="w-24"
                            />
                            <Input
                              value={editTeam.name}
                              onChange={(e) => setEditTeam(prev => ({ ...prev, name: e.target.value }))}
                              className="flex-1"
                            />
                            <Select
                              value={editTeam.departmentCode}
                              onValueChange={(value) => setEditTeam(prev => ({ ...prev, departmentCode: value }))}
                            >
                              <SelectTrigger className="w-32">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {departments.map((dept) => (
                                  <SelectItem key={dept.code} value={dept.code}>
                                    {dept.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <Button size="sm" onClick={handleSaveTeam}>
                              <Save className="w-4 h-4" />
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => setEditingTeam(null)}>
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        ) : (
                          <>
                            <div className="flex-1">
                              <div className="font-medium">{team.name}</div>
                              <div className="text-sm text-muted-foreground">
                                {team.code} • {departments.find(d => d.code === team.departmentCode)?.name}
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Button size="sm" variant="outline" onClick={() => handleEditTeam(team)}>
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => setDeleteData({ type: 'team', code: team.code })}>
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <Button onClick={onClose}>
              닫기
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteData} onOpenChange={(open) => !open && setDeleteData(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>정말 삭제하시겠습니까?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteData?.type === 'department'
                ? "이 부서를 삭제하면 소속된 모든 팀도 함께 삭제됩니다. 이 작업은 되돌릴 수 없습니다."
                : "이 팀을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              삭제
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
