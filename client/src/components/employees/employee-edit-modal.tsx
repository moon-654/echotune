import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { DatePicker } from "@/components/ui/date-picker";
import { Loader2 } from "lucide-react";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { DepartmentTeamManager } from "@/lib/departments-teams";
import { useToast } from "@/hooks/use-toast";
import DepartmentTeamManagerModal from "./department-team-manager-modal";
import type { Employee, InsertEmployee } from "@shared/schema";

interface EmployeeEditModalProps {
  employee: Employee | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function EmployeeEditModal({ employee, isOpen, onClose }: EmployeeEditModalProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [formData, setFormData] = useState<Partial<InsertEmployee>>({});
  const [date, setDate] = useState<Date | undefined>();
  const [birthDate, setBirthDate] = useState<Date | undefined>();
  const [selectedDepartment, setSelectedDepartment] = useState<string>("");
  const [education, setEducation] = useState({
    degree: '',
    major: '',
    school: '',
    graduationYear: ''
  });
  const [previousExperience, setPreviousExperience] = useState({
    years: 0,
    months: 0
  });
  const [isDepartmentTeamManagerOpen, setIsDepartmentTeamManagerOpen] = useState(false);

  // 부서/팀 데이터 로드
  const [departments, setDepartments] = useState<Department[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(false);

  // 부서/팀 데이터 로드
  useEffect(() => {
    const loadData = async () => {
      if (isOpen) {
        setLoading(true);
        try {
          const [deptData, teamData] = await Promise.all([
            DepartmentTeamManager.getAllDepartments(),
            DepartmentTeamManager.getAllTeams()
          ]);
          setDepartments(deptData);
          setTeams(teamData);
          console.log('🔍 부서/팀 데이터 로드:', {
            departments: deptData,
            teams: teamData
          });
        } catch (error) {
          console.error('부서/팀 데이터 로드 실패:', error);
        } finally {
          setLoading(false);
        }
      }
    };
    loadData();
  }, [isOpen]);

  // 직원 데이터를 폼에 로드
  useEffect(() => {
    if (employee) {
      console.log('🔍 직원 데이터 로드:', {
        name: employee.name,
        departmentCode: employee.departmentCode,
        department: employee.department,
        teamCode: employee.teamCode,
        team: employee.team
      });
      
      // 팀 매칭 로직 개선 (팀 데이터가 있을 때만)
      let matchedTeamCode = employee.teamCode;
      if (teams.length > 0 && !matchedTeamCode && employee.team && employee.departmentCode) {
        // team 필드가 있으면 해당 팀을 찾아서 teamCode 설정
        const matchedTeam = teams.find(t => 
          t.name === employee.team && t.departmentCode === employee.departmentCode
        );
        if (matchedTeam) {
          matchedTeamCode = matchedTeam.code;
          console.log('✅ 팀 매칭 성공:', {
            teamName: employee.team,
            departmentCode: employee.departmentCode,
            matchedTeamCode: matchedTeam.code
          });
        } else {
          console.log('❌ 팀 매칭 실패:', {
            teamName: employee.team,
            departmentCode: employee.departmentCode,
            availableTeams: teams.filter(t => t.departmentCode === employee.departmentCode)
          });
        }
      }

      setFormData({
        employeeNumber: employee.employeeNumber,
        departmentCode: employee.departmentCode,
        teamCode: matchedTeamCode,
        name: employee.name,
        position: employee.position,
        department: employee.department,
        team: employee.team,
        email: employee.email || "",
        phone: employee.phone || "",
        hireDate: employee.hireDate ? new Date(employee.hireDate) : undefined,
        birthDate: employee.birthDate ? new Date(employee.birthDate) : undefined,
        managerId: employee.managerId || "",
        photoUrl: employee.photoUrl || "",
        education: employee.education || "",
        major: employee.major || "",
        school: employee.school || "",
        graduationYear: employee.graduationYear || undefined,
        isActive: employee.isActive
      });
      setDate(employee.hireDate ? new Date(employee.hireDate) : undefined);
      setBirthDate(employee.birthDate ? new Date(employee.birthDate) : undefined);
      setSelectedDepartment(employee.departmentCode || "");
      
      // 학력 정보 초기화
      setEducation({
        degree: employee.education || '',
        major: employee.major || '',
        school: employee.school || '',
        graduationYear: employee.graduationYear?.toString() || ''
      });
      
      // 이전 경력 정보 초기화
      setPreviousExperience({
        years: Number(employee.previousExperienceYears) || 0,
        months: Number(employee.previousExperienceMonths) || 0
      });
    }
  }, [employee, teams]);

  // 팀 데이터가 로드된 후 직원 데이터 재초기화
  useEffect(() => {
    if (employee && teams.length > 0) {
      console.log('🔄 팀 데이터 로드 후 직원 데이터 재초기화');
      
      // 팀 매칭 로직
      let matchedTeamCode = employee.teamCode;
      if (!matchedTeamCode && employee.team && employee.departmentCode) {
        const matchedTeam = teams.find(t => 
          t.name === employee.team && t.departmentCode === employee.departmentCode
        );
        if (matchedTeam) {
          matchedTeamCode = matchedTeam.code;
          console.log('✅ 팀 매칭 성공 (재초기화):', matchedTeam.code);
        }
      }

      // formData 업데이트
      setFormData(prev => ({
        ...prev,
        teamCode: matchedTeamCode
      }));
    }
  }, [teams.length, employee]);

  // 직원 목록 조회 (상사 선택용)
  const { data: allEmployees, isLoading: isLoadingEmployees } = useQuery<Employee[]>({
    queryKey: ['/api/employees']
  });

  // 직원 수정 mutation
  const updateEmployeeMutation = useMutation({
    mutationFn: async (data: Partial<InsertEmployee>) => {
      if (!employee) throw new Error("No employee selected");
      
      console.log('🚀 API 호출 시작:', {
        url: `/api/employees/${employee.id}`,
        method: 'PUT',
        data: data
      });
      
      const response = await fetch(`/api/employees/${employee.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
      });

      console.log('📡 API 응답 상태:', response.status);
      console.log('📡 API 응답 헤더:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ API 오류 응답:', errorText);
        throw new Error(`Failed to update employee: ${response.status} ${errorText}`);
      }

      const result = await response.json();
      console.log('✅ API 성공 응답:', result);
      return result;
    },
    onSuccess: (data) => {
      console.log('🎉 직원 수정 성공:', data);
      queryClient.invalidateQueries({ queryKey: ['/api/employees'] });
      toast({
        title: "직원 수정 완료",
        description: `${data.name}님의 정보가 성공적으로 수정되었습니다.`,
      });
      onClose();
    },
    onError: (error) => {
      console.error('💥 직원 수정 실패:', error);
      console.error('💥 오류 타입:', typeof error);
      console.error('💥 오류 메시지:', error.message);
      console.error('💥 오류 스택:', error.stack);
      toast({
        title: "직원 수정 실패",
        description: error.message || "직원 정보 수정 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!employee) return;

    const submitData: Partial<InsertEmployee> = {
      name: formData.name,
      position: formData.position,
      department: formData.department,
      departmentCode: formData.departmentCode,
      team: formData.team,
      teamCode: formData.teamCode,
      managerId: formData.managerId || null,
      employeeNumber: formData.employeeNumber,
      isDepartmentHead: formData.isDepartmentHead,
      isActive: formData.isActive,
      phone: formData.phone,
      email: formData.email,
      address: formData.address,
      birthDate: birthDate ? birthDate.toISOString() : null, // ISO 문자열로 전송
      hireDate: date ? date.toISOString() : null, // ISO 문자열로 전송
      education: education.degree, // 문자열로 전송 (객체가 아닌)
      major: education.major,
      school: education.school,
      graduationYear: education.graduationYear ? parseInt(education.graduationYear) : undefined,
      previousExperienceYears: Number(previousExperience.years), // 숫자로 변환
      previousExperienceMonths: Number(previousExperience.months) // 숫자로 변환
    };

    updateEmployeeMutation.mutate(submitData);
  };

  const handleInputChange = (field: keyof InsertEmployee, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (!employee) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>직원 정보 수정</DialogTitle>
          <DialogDescription>
            직원의 기본 정보, 조직 정보, 추가 정보를 수정할 수 있습니다.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 기본 정보 */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">기본 정보</h3>
              
              <div>
                <Label htmlFor="employeeNumber">사원번호</Label>
                <Input
                  id="employeeNumber"
                  value={formData.employeeNumber || ""}
                  onChange={(e) => handleInputChange("employeeNumber", e.target.value)}
                  required
                />
              </div>

              <div>
                <Label htmlFor="name">이름</Label>
                <Input
                  id="name"
                  value={formData.name || ""}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  required
                />
              </div>

              <div>
                <Label htmlFor="position">직책</Label>
                <Input
                  id="position"
                  value={formData.position || ""}
                  onChange={(e) => handleInputChange("position", e.target.value)}
                  required
                />
              </div>

              <div>
                <Label htmlFor="email">이메일</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email || ""}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="phone">전화번호</Label>
                <Input
                  id="phone"
                  value={formData.phone || ""}
                  onChange={(e) => handleInputChange("phone", e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="birthDate">생년월일</Label>
                <DatePicker
                  date={birthDate}
                  onDateChange={setBirthDate}
                  placeholder="생년월일을 선택하세요"
                />
              </div>

              {/* 학력 정보 */}
              <div className="mt-6">
                <h4 className="text-md font-semibold mb-3">학력 정보</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="degree">최종학력</Label>
                    <Select
                      value={education.degree}
                      onValueChange={(value) => setEducation(prev => ({ ...prev, degree: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="학력 선택" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="high_school">고등학교 졸업</SelectItem>
                        <SelectItem value="associate">전문대학 졸업</SelectItem>
                        <SelectItem value="bachelor">대학교 졸업</SelectItem>
                        <SelectItem value="master">대학원 졸업</SelectItem>
                        <SelectItem value="phd">박사 졸업</SelectItem>
                        <SelectItem value="studying_high_school">고등학교 재학중</SelectItem>
                        <SelectItem value="studying_associate">전문대학 재학중</SelectItem>
                        <SelectItem value="studying_bachelor">대학교 재학중</SelectItem>
                        <SelectItem value="studying_master">대학원 재학중</SelectItem>
                        <SelectItem value="studying_phd">박사과정 재학중</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="school">학교명</Label>
                    <Input
                      id="school"
                      value={education.school}
                      onChange={(e) => setEducation(prev => ({ ...prev, school: e.target.value }))}
                      placeholder="예: 서울대학교"
                    />
                  </div>

                  <div>
                    <Label htmlFor="major">전공</Label>
                    <Input
                      id="major"
                      value={education.major}
                      onChange={(e) => setEducation(prev => ({ ...prev, major: e.target.value }))}
                      placeholder="예: 컴퓨터공학"
                    />
                  </div>

                  <div>
                    <Label htmlFor="graduationYear">졸업년도</Label>
                    <Input
                      id="graduationYear"
                      type="number"
                      value={education.graduationYear}
                      onChange={(e) => setEducation(prev => ({ ...prev, graduationYear: e.target.value }))}
                      placeholder="예: 2020"
                      min="1950"
                      max="2030"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* 조직 정보 */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">조직 정보</h3>
              
              <div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="department">부서</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setIsDepartmentTeamManagerOpen(true)}
                  >
                    부서/팀 관리
                  </Button>
                </div>
                <Select 
                  value={selectedDepartment} 
                  onValueChange={(value) => {
                    console.log('🏢 부서 선택:', { value, departments });
                    setSelectedDepartment(value);
                    const dept = departments.find(d => d.code === value);
                    console.log('🏢 선택된 부서:', dept);
                    if (dept) {
                      setFormData(prev => ({
                        ...prev,
                        departmentCode: dept.code,
                        department: dept.name
                      }));
                      console.log('🏢 부서 정보 업데이트:', { departmentCode: dept.code, department: dept.name });
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="부서 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.isArray(departments) && departments.map(dept => (
                      <SelectItem key={dept.code} value={dept.code}>
                        {dept.name} ({dept.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="team">팀</Label>
                <Select 
                  value={formData.teamCode || "none"} 
                  onValueChange={(value) => {
                    console.log('👥 팀 선택:', { value, teams });
                    if (value === "none") {
                      setFormData(prev => ({
                        ...prev,
                        teamCode: null,
                        team: null
                      }));
                      console.log('👥 팀 정보 제거');
                    } else {
                      const team = teams.find(t => t.code === value);
                      console.log('👥 선택된 팀:', team);
                      if (team) {
                        setFormData(prev => ({
                          ...prev,
                          teamCode: team.code,
                          team: team.name
                        }));
                        console.log('👥 팀 정보 업데이트:', { teamCode: team.code, team: team.name });
                      }
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="팀 선택 (부서장은 선택하지 않음)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">팀 없음 (부서장)</SelectItem>
                    {Array.isArray(teams) && teams
                      .filter(team => team.departmentCode === selectedDepartment)
                      .map(team => (
                        <SelectItem key={team.code} value={team.code}>
                          {team.name} ({team.code})
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="managerId">상사</Label>
                <Select 
                  value={formData.managerId || "none"} 
                  onValueChange={(value) => {
                    if (value === "none") {
                      handleInputChange("managerId", null);
                    } else {
                      handleInputChange("managerId", value);
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="상사 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">상사 없음</SelectItem>
                    {allEmployees
                      ?.filter(emp => emp.id !== employee.id) // 자기 자신 제외
                      .map(emp => (
                        <SelectItem key={emp.id} value={emp.id}>
                          {emp.name} ({emp.position}) - {emp.department}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* 추가 정보 */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">추가 정보</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="hireDate">입사일</Label>
                <DatePicker
                  date={date}
                  onDateChange={setDate}
                  placeholder="입사일을 선택하세요"
                />
              </div>

              <div>
                <Label>이전 경력</Label>
                <div className="flex items-center space-x-2">
                  <Input
                    type="number"
                    min="0"
                    max="50"
                    value={previousExperience.years}
                    onChange={(e) => setPreviousExperience(prev => ({
                      ...prev,
                      years: Number(e.target.value) || 0
                    }))}
                    className="w-20"
                    placeholder="년"
                  />
                  <span className="text-sm text-muted-foreground">년</span>
                  <Input
                    type="number"
                    min="0"
                    max="11"
                    value={previousExperience.months}
                    onChange={(e) => setPreviousExperience(prev => ({
                      ...prev,
                      months: Number(e.target.value) || 0
                    }))}
                    className="w-20"
                    placeholder="월"
                  />
                  <span className="text-sm text-muted-foreground">개월</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  입사 전 총 경력을 입력하세요
                </p>
              </div>

              <div>
                <Label htmlFor="photoUrl">프로필 사진 URL</Label>
                <Input
                  id="photoUrl"
                  value={formData.photoUrl || ""}
                  onChange={(e) => handleInputChange("photoUrl", e.target.value)}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="isActive">활성 상태</Label>
              <div className="flex space-x-4">
                <label className="flex items-center space-x-2">
                  <input
                    type="radio"
                    name="isActive"
                    value="true"
                    checked={formData.isActive === true}
                    onChange={(e) => handleInputChange("isActive", true)}
                    className="w-4 h-4"
                  />
                  <span className="text-sm">활성</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="radio"
                    name="isActive"
                    value="false"
                    checked={formData.isActive === false}
                    onChange={(e) => handleInputChange("isActive", false)}
                    className="w-4 h-4"
                  />
                  <span className="text-sm">비활성</span>
                </label>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              취소
            </Button>
            <Button 
              type="submit" 
              disabled={updateEmployeeMutation.isPending}
            >
              {updateEmployeeMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              수정 완료
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
      
      {/* 부서/팀 관리 모달 */}
      <DepartmentTeamManagerModal
        isOpen={isDepartmentTeamManagerOpen}
        onClose={() => {
          setIsDepartmentTeamManagerOpen(false);
          // 부서/팀 데이터 새로고침
          const deptData = DepartmentTeamManager.getAllDepartments();
          const teamData = DepartmentTeamManager.getAllTeams();
          setDepartments(deptData);
          setTeams(teamData);
        }}
      />
    </Dialog>
  );
}
