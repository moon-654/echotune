import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Search, Eye, Edit, Trash2 } from "lucide-react";
import type { TrainingHistory } from "@shared/schema";

interface TrainingTableProps {
  trainings: TrainingHistory[];
}

export default function TrainingTable({ trainings }: TrainingTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const filteredTrainings = trainings.filter(training => {
    const matchesSearch = training.courseName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         training.provider.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = !statusFilter || statusFilter === "all" || training.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="default" className="bg-green-100 text-green-800">완료</Badge>;
      case 'ongoing':
        return <Badge variant="default" className="bg-yellow-100 text-yellow-800">진행중</Badge>;
      case 'planned':
        return <Badge variant="default" className="bg-blue-100 text-blue-800">예정</Badge>;
      case 'cancelled':
        return <Badge variant="default" className="bg-red-100 text-red-800">취소</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'required':
        return <Badge variant="default" className="bg-red-100 text-red-800">필수</Badge>;
      case 'optional':
        return <Badge variant="default" className="bg-blue-100 text-blue-800">선택</Badge>;
      case 'certification':
        return <Badge variant="default" className="bg-purple-100 text-purple-800">자격증</Badge>;
      default:
        return <Badge variant="secondary">{type}</Badge>;
    }
  };

  const handleViewTraining = (trainingId: string) => {
  };

  const handleEditTraining = (trainingId: string) => {
  };

  const handleDeleteTraining = (trainingId: string) => {
  };

  return (
    <div className="space-y-4" data-testid="training-table">
      {/* Search and Filters */}
      <div className="flex items-center space-x-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="교육과정 검색..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            data-testid="input-training-search"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48" data-testid="select-status-filter">
            <SelectValue placeholder="모든 상태" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">모든 상태</SelectItem>
            <SelectItem value="completed">완료</SelectItem>
            <SelectItem value="ongoing">진행중</SelectItem>
            <SelectItem value="planned">예정</SelectItem>
            <SelectItem value="cancelled">취소</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Results Summary */}
      <div className="text-sm text-muted-foreground">
        총 {filteredTrainings.length}개의 교육과정
      </div>

      {/* Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>교육과정</TableHead>
              <TableHead>유형</TableHead>
              <TableHead>제공기관</TableHead>
              <TableHead>시작일</TableHead>
              <TableHead>완료일</TableHead>
              <TableHead>상태</TableHead>
              <TableHead>관리</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredTrainings.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  {searchTerm || statusFilter 
                    ? "검색 조건에 맞는 교육과정이 없습니다."
                    : "등록된 교육과정이 없습니다."
                  }
                </TableCell>
              </TableRow>
            ) : (
              filteredTrainings.map((training) => (
                <TableRow key={training.id} className="hover:bg-muted/30">
                  <TableCell>
                    <div>
                      <p className="font-medium" data-testid={`training-name-${training.id}`}>
                        {training.courseName}
                      </p>
                      <p className="text-sm text-muted-foreground">{training.category}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    {getTypeBadge(training.type)}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {training.provider}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {training.startDate 
                      ? new Date(training.startDate).toLocaleDateString('ko-KR')
                      : '-'
                    }
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {training.completionDate 
                      ? new Date(training.completionDate).toLocaleDateString('ko-KR')
                      : '-'
                    }
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(training.status)}
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewTraining(training.id)}
                        data-testid={`button-view-training-${training.id}`}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditTraining(training.id)}
                        data-testid={`button-edit-training-${training.id}`}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteTraining(training.id)}
                        className="text-destructive hover:text-destructive"
                        data-testid={`button-delete-training-${training.id}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
