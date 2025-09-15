import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Upload, BookOpen, Clock, Users, Calendar } from "lucide-react";
import TrainingTable from "@/components/training/training-table";
import type { TrainingHistory } from "@shared/schema";

interface TrainingStats {
  total: number;
  completed: number;
  ongoing: number;
  scheduled: number;
}

export default function Training() {
  const { data: trainings, isLoading } = useQuery<TrainingHistory[]>({
    queryKey: ['/api/training']
  });

  // Calculate training stats
  const stats: TrainingStats = {
    total: trainings?.length || 0,
    completed: trainings?.filter(t => t.status === 'completed').length || 0,
    ongoing: trainings?.filter(t => t.status === 'ongoing').length || 0,
    scheduled: trainings?.filter(t => t.status === 'planned').length || 0
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-muted rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-muted rounded-lg"></div>
            ))}
          </div>
          <div className="h-96 bg-muted rounded-lg"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6" data-testid="training-page">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">교육 관리</h1>
          <p className="text-muted-foreground">교육 과정 및 이수 현황 관리</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" data-testid="button-import-training">
            <Upload className="w-4 h-4 mr-2" />
            엑셀 가져오기
          </Button>
          <Button data-testid="button-add-training">
            <Plus className="w-4 h-4 mr-2" />
            새 교육 추가
          </Button>
        </div>
      </div>

      {/* Training Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card data-testid="stats-total-training">
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <BookOpen className="w-8 h-8 text-primary" />
            </div>
            <p className="text-2xl font-bold text-primary">{stats.total}</p>
            <p className="text-sm text-muted-foreground">총 교육과정</p>
          </CardContent>
        </Card>

        <Card data-testid="stats-completed-training">
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <Users className="w-8 h-8 text-green-600" />
            </div>
            <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
            <p className="text-sm text-muted-foreground">완료된 교육</p>
          </CardContent>
        </Card>

        <Card data-testid="stats-ongoing-training">
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <Clock className="w-8 h-8 text-yellow-600" />
            </div>
            <p className="text-2xl font-bold text-yellow-600">{stats.ongoing}</p>
            <p className="text-sm text-muted-foreground">진행중인 교육</p>
          </CardContent>
        </Card>

        <Card data-testid="stats-scheduled-training">
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <Calendar className="w-8 h-8 text-blue-600" />
            </div>
            <p className="text-2xl font-bold text-blue-600">{stats.scheduled}</p>
            <p className="text-sm text-muted-foreground">예정된 교육</p>
          </CardContent>
        </Card>
      </div>

      {/* Training Table */}
      <Card>
        <CardHeader>
          <CardTitle>교육 과정 목록</CardTitle>
        </CardHeader>
        <CardContent>
          {trainings && trainings.length > 0 ? (
            <TrainingTable trainings={trainings} />
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">등록된 교육과정이 없습니다</h3>
              <p className="text-sm mb-4">새로운 교육과정을 추가하여 시작하세요.</p>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                교육과정 추가
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
