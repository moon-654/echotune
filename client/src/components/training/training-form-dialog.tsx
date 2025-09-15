import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { insertTrainingHistorySchema } from "@shared/schema";
import type { Employee } from "@shared/schema";

// Form schema for training form - using strings for form inputs
const trainingFormSchema = insertTrainingHistorySchema.extend({
  startDate: z.string().optional(),
  completionDate: z.string().optional(),
  duration: z.string().optional(),
  score: z.string().optional(),
});

type TrainingFormData = z.infer<typeof trainingFormSchema>;

interface TrainingFormDialogProps {
  children: React.ReactNode;
  defaultEmployeeId?: string;
}

export default function TrainingFormDialog({ children, defaultEmployeeId }: TrainingFormDialogProps) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch employees for the employee select field
  const { data: employees } = useQuery<Employee[]>({
    queryKey: ['/api/employees']
  });

  const form = useForm<TrainingFormData>({
    resolver: zodResolver(trainingFormSchema),
    defaultValues: {
      employeeId: defaultEmployeeId || "",
      courseName: "",
      provider: "",
      type: "optional",
      category: "",
      startDate: "",
      completionDate: "",
      duration: "",
      score: "",
      status: "planned",
      certificateUrl: "",
      notes: "",
    },
  });

  const createTrainingMutation = useMutation({
    mutationFn: async (data: TrainingFormData) => {
      // Convert form data to proper API payload types
      const payload = {
        employeeId: data.employeeId,
        courseName: data.courseName,
        provider: data.provider,
        type: data.type,
        category: data.category,
        startDate: data.startDate && data.startDate !== "" ? new Date(data.startDate) : null,
        completionDate: data.completionDate && data.completionDate !== "" ? new Date(data.completionDate) : null,
        duration: data.duration && data.duration !== "" ? parseInt(data.duration, 10) : null,
        score: data.score && data.score !== "" ? parseFloat(data.score) : null,
        status: data.status,
        certificateUrl: data.certificateUrl || null,
        notes: data.notes || null,
      };
      
      return apiRequest("POST", "/api/training", payload);
    },
    onSuccess: () => {
      toast({
        title: "교육 추가 완료",
        description: "새로운 교육이 성공적으로 추가되었습니다.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/training'] });
      setOpen(false);
      form.reset();
    },
    onError: (error) => {
      toast({
        title: "교육 추가 실패",
        description: error instanceof Error ? error.message : "교육 추가 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: TrainingFormData) => {
    createTrainingMutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>새 교육 추가</DialogTitle>
          <DialogDescription>
            새로운 교육 과정을 등록하세요. 필수 정보를 입력해주세요.
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Employee Selection */}
            <FormField
              control={form.control}
              name="employeeId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>직원</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-employee">
                        <SelectValue placeholder="직원을 선택하세요" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {employees?.map((employee) => (
                        <SelectItem key={employee.id} value={employee.id}>
                          {employee.name} - {employee.department}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Course Name */}
            <FormField
              control={form.control}
              name="courseName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>교육과정명</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="교육과정명을 입력하세요"
                      data-testid="input-course-name"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Provider */}
            <FormField
              control={form.control}
              name="provider"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>교육기관</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="교육기관명을 입력하세요"
                      data-testid="input-provider"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              {/* Type */}
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>교육 유형</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-training-type">
                          <SelectValue placeholder="유형 선택" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="required">필수</SelectItem>
                        <SelectItem value="optional">선택</SelectItem>
                        <SelectItem value="certification">자격증</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Category */}
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>카테고리</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-category">
                          <SelectValue placeholder="카테고리 선택" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="security">보안</SelectItem>
                        <SelectItem value="leadership">리더십</SelectItem>
                        <SelectItem value="technical">기술</SelectItem>
                        <SelectItem value="communication">커뮤니케이션</SelectItem>
                        <SelectItem value="compliance">컴플라이언스</SelectItem>
                        <SelectItem value="safety">안전</SelectItem>
                        <SelectItem value="other">기타</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Start Date */}
              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>시작일</FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        data-testid="input-start-date"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Completion Date */}
              <FormField
                control={form.control}
                name="completionDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>완료일</FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        data-testid="input-completion-date"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Duration */}
              <FormField
                control={form.control}
                name="duration"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>교육시간 (시간)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        placeholder="시간"
                        data-testid="input-duration"
                        value={field.value || ""}
                        onChange={(e) => field.onChange(e.target.value || "")}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Score */}
              <FormField
                control={form.control}
                name="score"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>점수</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        step="0.1"
                        placeholder="점수"
                        data-testid="input-score"
                        value={field.value || ""}
                        onChange={(e) => field.onChange(e.target.value || "")}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Status */}
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>상태</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-status">
                        <SelectValue placeholder="상태 선택" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="planned">예정</SelectItem>
                      <SelectItem value="ongoing">진행중</SelectItem>
                      <SelectItem value="completed">완료</SelectItem>
                      <SelectItem value="cancelled">취소</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Certificate URL */}
            <FormField
              control={form.control}
              name="certificateUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>수료증 URL (선택)</FormLabel>
                  <FormControl>
                    <Input
                      type="url"
                      placeholder="https://..."
                      data-testid="input-certificate-url"
                      value={field.value || ""}
                      onChange={field.onChange}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Notes */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>메모 (선택)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="추가 메모사항을 입력하세요"
                      data-testid="textarea-notes"
                      value={field.value || ""}
                      onChange={field.onChange}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                data-testid="button-cancel"
              >
                취소
              </Button>
              <Button
                type="submit"
                disabled={createTrainingMutation.isPending}
                data-testid="button-submit"
              >
                {createTrainingMutation.isPending ? "추가 중..." : "추가"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}