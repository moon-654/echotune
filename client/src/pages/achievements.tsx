import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { 
  Trophy, 
  FileText, 
  Medal, 
  Plus,
  Edit,
  Eye,
  Download,
  Filter,
  Search,
  Calendar,
  User,
  Building
} from "lucide-react";
import PatentModal from "@/components/achievements/patent-modal";
import PublicationModal from "@/components/achievements/publication-modal";
import AwardModal from "@/components/achievements/award-modal";

interface Patent {
  id: string;
  employeeId: string;
  employeeName: string;
  department: string;
  title: string;
  patentNumber: string;
  applicationDate: string;
  registrationDate?: string;
  status: 'pending' | 'registered' | 'rejected';
  inventors: string[];
  description: string;
  category: string;
}

interface Publication {
  id: string;
  employeeId: string;
  employeeName: string;
  department: string;
  title: string;
  authors: string[];
  journal: string;
  publicationDate: string;
  doi?: string;
  impactFactor?: number;
  category: 'journal' | 'conference' | 'book' | 'other';
  description: string;
}

interface Award {
  id: string;
  employeeId: string;
  employeeName: string;
  department: string;
  title: string;
  awardingOrganization: string;
  awardDate: string;
  category: string;
  level: 'international' | 'national' | 'company' | 'department';
  description: string;
  certificateUrl?: string;
}

interface AchievementStats {
  totalPatents: number;
  totalPublications: number;
  totalAwards: number;
  pendingPatents: number;
  recentAchievements: Array<{
    type: 'patent' | 'publication' | 'award';
    title: string;
    employeeName: string;
    date: string;
  }>;
}

export default function Achievements() {
  const [activeTab, setActiveTab] = useState("overview");
  const [patents, setPatents] = useState<Patent[]>([]);
  const [publications, setPublications] = useState<Publication[]>([]);
  const [awards, setAwards] = useState<Award[]>([]);
  const [stats, setStats] = useState<AchievementStats | null>(null);
  const [loading, setLoading] = useState(true);
  
  // 모달 상태
  const [isPatentModalOpen, setIsPatentModalOpen] = useState(false);
  const [isPublicationModalOpen, setIsPublicationModalOpen] = useState(false);
  const [isAwardModalOpen, setIsAwardModalOpen] = useState(false);
  const [selectedAchievement, setSelectedAchievement] = useState<any>(null);

  // 데이터 로드
  useEffect(() => {
    loadAchievements();
    loadStats();
  }, []);

  const loadAchievements = async () => {
    try {
      // 특허 데이터 로드 (기존 API 사용)
      const patentsResponse = await fetch('/api/patents');
      if (patentsResponse.ok) {
        const patentsData = await patentsResponse.json();
        setPatents(patentsData);
      }

      // 논문 데이터 로드 (기존 API 사용)
      const publicationsResponse = await fetch('/api/publications');
      if (publicationsResponse.ok) {
        const publicationsData = await publicationsResponse.json();
        setPublications(publicationsData);
      }

      // 수상 데이터 로드 (기존 API 사용)
      const awardsResponse = await fetch('/api/awards');
      if (awardsResponse.ok) {
        const awardsData = await awardsResponse.json();
        setAwards(awardsData);
      }
    } catch (error) {
      console.error('성과 데이터 로드 오류:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      // 기존 API를 사용하여 통계 계산
      const [patentsResponse, publicationsResponse, awardsResponse] = await Promise.all([
        fetch('/api/patents'),
        fetch('/api/publications'),
        fetch('/api/awards')
      ]);

      if (patentsResponse.ok && publicationsResponse.ok && awardsResponse.ok) {
        const [patents, publications, awards] = await Promise.all([
          patentsResponse.json(),
          publicationsResponse.json(),
          awardsResponse.json()
        ]);

        const stats = {
          totalPatents: patents.length,
          totalPublications: publications.length,
          totalAwards: awards.length,
          pendingPatents: patents.filter(p => p.status === 'pending').length,
          recentAchievements: [
            ...patents.slice(-5).map(p => ({ type: 'patent', title: p.title, date: p.applicationDate })),
            ...publications.slice(-5).map(p => ({ type: 'publication', title: p.title, date: p.publicationDate })),
            ...awards.slice(-5).map(a => ({ type: 'award', title: a.name, date: a.awardDate }))
          ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 10)
        };

        setStats(stats);
      }
    } catch (error) {
      console.error('통계 데이터 로드 오류:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'registered': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'international': return 'bg-purple-100 text-purple-800';
      case 'national': return 'bg-blue-100 text-blue-800';
      case 'company': return 'bg-green-100 text-green-800';
      case 'department': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">성과관리</h1>
          <p className="text-muted-foreground">특허, 논문, 수상 실적 관리</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={() => setIsAwardModalOpen(true)}>
            <Medal className="w-4 h-4 mr-2" />
            수상 등록
          </Button>
          <Button variant="outline" onClick={() => setIsPublicationModalOpen(true)}>
            <FileText className="w-4 h-4 mr-2" />
            논문 등록
          </Button>
          <Button onClick={() => setIsPatentModalOpen(true)}>
            <Trophy className="w-4 h-4 mr-2" />
            특허 등록
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">개요</TabsTrigger>
          <TabsTrigger value="patents">특허</TabsTrigger>
          <TabsTrigger value="publications">논문</TabsTrigger>
          <TabsTrigger value="awards">수상</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">총 특허 수</CardTitle>
                <Trophy className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.totalPatents || 0}</div>
                <p className="text-xs text-muted-foreground">
                  등록/출원 중
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">총 논문 수</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.totalPublications || 0}</div>
                <p className="text-xs text-muted-foreground">
                  학술지/학회 발표
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">총 수상 수</CardTitle>
                <Medal className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.totalAwards || 0}</div>
                <p className="text-xs text-muted-foreground">
                  국내외 수상
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">출원 대기</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.pendingPatents || 0}</div>
                <p className="text-xs text-muted-foreground">
                  심사 중인 특허
                </p>
              </CardContent>
            </Card>
          </div>

          {/* 최근 성과 */}
          <Card>
            <CardHeader>
              <CardTitle>최근 성과</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stats?.recentAchievements?.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">등록된 성과가 없습니다.</p>
                ) : (
                  stats?.recentAchievements?.map((achievement, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        {achievement.type === 'patent' && <Trophy className="w-4 h-4 text-blue-600" />}
                        {achievement.type === 'publication' && <FileText className="w-4 h-4 text-green-600" />}
                        {achievement.type === 'award' && <Medal className="w-4 h-4 text-yellow-600" />}
                        <div>
                          <p className="font-medium">{achievement.title}</p>
                          <p className="text-sm text-muted-foreground">{achievement.employeeName}</p>
                        </div>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {achievement.date}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Patents Tab */}
        <TabsContent value="patents" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>특허 관리</CardTitle>
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm">
                    <Filter className="w-4 h-4 mr-2" />
                    필터
                  </Button>
                  <Button variant="outline" size="sm">
                    <Download className="w-4 h-4 mr-2" />
                    내보내기
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {patents.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">등록된 특허가 없습니다.</p>
                  </div>
                ) : (
                  patents.map((patent) => (
                    <div key={patent.id} className="p-4 border rounded-lg hover:bg-gray-50">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-4">
                            <div>
                              <h3 className="font-medium">{patent.title}</h3>
                              <p className="text-sm text-muted-foreground">{patent.employeeName} • {patent.department}</p>
                              <p className="text-sm text-muted-foreground">특허번호: {patent.patentNumber}</p>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Badge className={getStatusColor(patent.status)}>
                                {patent.status === 'registered' ? '등록' : 
                                 patent.status === 'pending' ? '출원' : '반려'}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-muted-foreground">
                            출원일: {patent.applicationDate}
                          </div>
                          {patent.registrationDate && (
                            <div className="text-sm text-muted-foreground">
                              등록일: {patent.registrationDate}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Publications Tab */}
        <TabsContent value="publications" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>논문 관리</CardTitle>
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm">
                    <Filter className="w-4 h-4 mr-2" />
                    필터
                  </Button>
                  <Button variant="outline" size="sm">
                    <Download className="w-4 h-4 mr-2" />
                    내보내기
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {publications.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">등록된 논문이 없습니다.</p>
                  </div>
                ) : (
                  publications.map((publication) => (
                    <div key={publication.id} className="p-4 border rounded-lg hover:bg-gray-50">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-4">
                            <div>
                              <h3 className="font-medium">{publication.title}</h3>
                              <p className="text-sm text-muted-foreground">{publication.employeeName} • {publication.department}</p>
                              <p className="text-sm text-muted-foreground">{publication.journal}</p>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Badge variant="outline">
                                {publication.category === 'journal' ? '학술지' : 
                                 publication.category === 'conference' ? '학회' :
                                 publication.category === 'book' ? '도서' : '기타'}
                              </Badge>
                              {publication.impactFactor && (
                                <Badge variant="secondary">
                                  IF: {publication.impactFactor}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-muted-foreground">
                            발표일: {publication.publicationDate}
                          </div>
                          {publication.doi && (
                            <div className="text-sm text-muted-foreground">
                              DOI: {publication.doi}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Awards Tab */}
        <TabsContent value="awards" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>수상 관리</CardTitle>
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm">
                    <Filter className="w-4 h-4 mr-2" />
                    필터
                  </Button>
                  <Button variant="outline" size="sm">
                    <Download className="w-4 h-4 mr-2" />
                    내보내기
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {awards.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">등록된 수상이 없습니다.</p>
                  </div>
                ) : (
                  awards.map((award) => (
                    <div key={award.id} className="p-4 border rounded-lg hover:bg-gray-50">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-4">
                            <div>
                              <h3 className="font-medium">{award.title}</h3>
                              <p className="text-sm text-muted-foreground">{award.employeeName} • {award.department}</p>
                              <p className="text-sm text-muted-foreground">{award.awardingOrganization}</p>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Badge className={getLevelColor(award.level)}>
                                {award.level === 'international' ? '국제' : 
                                 award.level === 'national' ? '국가' :
                                 award.level === 'company' ? '회사' : '부서'}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-muted-foreground">
                            수상일: {award.awardDate}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modals */}
      <PatentModal
        isOpen={isPatentModalOpen}
        onClose={() => setIsPatentModalOpen(false)}
        onSuccess={() => {
          loadAchievements();
          loadStats();
        }}
      />

      <PublicationModal
        isOpen={isPublicationModalOpen}
        onClose={() => setIsPublicationModalOpen(false)}
        onSuccess={() => {
          loadAchievements();
          loadStats();
        }}
      />

      <AwardModal
        isOpen={isAwardModalOpen}
        onClose={() => setIsAwardModalOpen(false)}
        onSuccess={() => {
          loadAchievements();
          loadStats();
        }}
      />
    </div>
  );
}
