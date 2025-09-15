import { useState, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { Upload, FileSpreadsheet, CheckCircle, AlertCircle, X } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface UploadResult {
  success: boolean;
  totalRows: number;
  successCount: number;
  errorCount: number;
  errors?: Array<{ row: number; message: string }>;
}

interface TrainingUploadDialogProps {
  children: React.ReactNode;
}

export default function TrainingUploadDialog({ children }: TrainingUploadDialogProps) {
  const [open, setOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);

      // Simulate upload progress
      setUploadProgress(10);
      
      const response = await apiRequest("POST", "/api/training/upload", formData);
      const result = await response.json() as UploadResult;
      
      setUploadProgress(100);
      return result;
    },
    onSuccess: (result) => {
      setUploadResult(result);
      queryClient.invalidateQueries({ queryKey: ['/api/training'] });
      
      if (result.success && result.errorCount === 0) {
        toast({
          title: "업로드 완료",
          description: `${result.successCount}개 교육 데이터가 성공적으로 등록되었습니다.`
        });
      } else if (result.successCount > 0) {
        toast({
          title: "부분 업로드 완료", 
          description: `${result.successCount}개 성공, ${result.errorCount}개 실패`
        });
      }
    },
    onError: (error) => {
      console.error('Upload error:', error);
      toast({
        variant: "destructive",
        title: "업로드 실패",
        description: "파일 업로드 중 오류가 발생했습니다."
      });
    }
  });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Check file type
      const validTypes = ['application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'text/csv'];
      if (!validTypes.includes(file.type) && !file.name.match(/\.(xlsx|xls|csv)$/i)) {
        toast({
          variant: "destructive",
          title: "파일 형식 오류",
          description: "Excel(.xlsx, .xls) 또는 CSV 파일만 업로드 가능합니다."
        });
        return;
      }

      // Check file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        toast({
          variant: "destructive",
          title: "파일 크기 오류",
          description: "파일 크기는 10MB 이하여야 합니다."
        });
        return;
      }

      setSelectedFile(file);
      setUploadResult(null);
      setUploadProgress(0);
    }
  };

  const handleUpload = () => {
    if (selectedFile) {
      uploadMutation.mutate(selectedFile);
    }
  };

  const handleClose = () => {
    setOpen(false);
    setSelectedFile(null);
    setUploadResult(null);
    setUploadProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeFile = () => {
    setSelectedFile(null);
    setUploadResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]" data-testid="training-upload-dialog">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            교육 이력 파일 업로드
          </DialogTitle>
          <DialogDescription>
            Excel(.xlsx, .xls) 또는 CSV 파일을 업로드하여 교육 이력을 일괄 등록합니다.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* File Selection */}
          <div className="space-y-2">
            <Label htmlFor="file-upload">파일 선택</Label>
            <Input
              id="file-upload"
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              accept=".xlsx,.xls,.csv"
              className="cursor-pointer"
              data-testid="input-file-upload"
            />
            <p className="text-sm text-muted-foreground">
              최대 파일 크기: 10MB | 지원 형식: .xlsx, .xls, .csv
            </p>
          </div>

          {/* Selected File Info */}
          {selectedFile && (
            <div className="flex items-center gap-3 p-3 bg-muted rounded-lg" data-testid="selected-file-info">
              <FileSpreadsheet className="w-8 h-8 text-green-600" />
              <div className="flex-1">
                <p className="font-medium">{selectedFile.name}</p>
                <p className="text-sm text-muted-foreground">
                  {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={removeFile}
                data-testid="button-remove-file"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          )}

          {/* Upload Progress */}
          {uploadMutation.isPending && (
            <div className="space-y-2" data-testid="upload-progress">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">업로드 진행중...</span>
                <span className="text-sm text-muted-foreground">{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} className="h-2" />
            </div>
          )}

          {/* Upload Result */}
          {uploadResult && (
            <Alert data-testid="upload-result">
              {uploadResult.success ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <AlertCircle className="h-4 w-4 text-red-600" />
              )}
              <AlertDescription>
                <div className="space-y-2">
                  <div>
                    총 {uploadResult.totalRows}개 항목 중 {uploadResult.successCount}개 성공, {uploadResult.errorCount}개 실패
                  </div>
                  {uploadResult.errors && uploadResult.errors.length > 0 && (
                    <div className="mt-2 max-h-32 overflow-y-auto">
                      <p className="font-medium text-sm">오류 내역:</p>
                      <ul className="text-xs space-y-1">
                        {uploadResult.errors.map((error, index) => (
                          <li key={index} className="text-red-600">
                            행 {error.row}: {error.message}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Sample Template Info */}
          <Alert>
            <FileSpreadsheet className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-2">
                <p className="font-medium">업로드 파일 형식</p>
                <p className="text-sm">
                  다음 컬럼이 포함된 파일을 업로드하세요:
                </p>
                <div className="text-xs bg-muted p-2 rounded font-mono">
                  직원ID, 교육과정명, 교육기관, 유형, 카테고리, 시작일, 완료일, 교육시간, 점수, 상태
                </div>
              </div>
            </AlertDescription>
          </Alert>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} data-testid="button-cancel">
            취소
          </Button>
          <Button
            onClick={handleUpload}
            disabled={!selectedFile || uploadMutation.isPending}
            data-testid="button-upload"
          >
            {uploadMutation.isPending ? (
              <>
                <Upload className="w-4 h-4 mr-2 animate-spin" />
                업로드 중...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                업로드
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}