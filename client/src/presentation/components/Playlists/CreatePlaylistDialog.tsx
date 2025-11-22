import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useMusicRepository } from '../../hooks/useMusicRepository';
import { toast } from '@/hooks/use-toast';
import { Loader2, ImagePlus } from 'lucide-react';

interface CreatePlaylistDialogProps {
    onCreated: () => void;
    children: React.ReactNode;
}

export const CreatePlaylistDialog = ({ onCreated, children }: CreatePlaylistDialogProps) => {
    const [open, setOpen] = useState(false);
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [coverFile, setCoverFile] = useState<File | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const repository = useMusicRepository();

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setCoverFile(e.target.files[0]);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;

        setIsLoading(true);
        try {
            await repository.createPlaylist(name, description, coverFile || undefined);
            toast({ title: "Плейлист создан" });
            setName('');
            setDescription('');
            setCoverFile(null);
            setOpen(false);
            onCreated();
        } catch (error) {
            toast({ title: "Ошибка создания плейлиста", variant: "destructive" });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {children}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Новый плейлист</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 mt-2">
                    <div className="space-y-2">
                        <Label htmlFor="name">Название</Label>
                        <Input
                            id="name"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            placeholder="Мой плейлист"
                            className="bg-background"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="desc">Описание</Label>
                        <Textarea
                            id="desc"
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            placeholder="О чем этот плейлист?"
                            className="resize-none bg-background"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="cover">Обложка</Label>
                        <div className="flex items-center gap-3">
                            <div className="shrink-0">
                                {coverFile ? (
                                    <div className="h-12 w-12 rounded overflow-hidden border">
                                        <img
                                            src={URL.createObjectURL(coverFile)}
                                            alt="Preview"
                                            className="h-full w-full object-cover"
                                        />
                                    </div>
                                ) : (
                                    <div className="h-12 w-12 rounded border border-dashed flex items-center justify-center bg-muted/50">
                                        <ImagePlus className="h-5 w-5 text-muted-foreground" />
                                    </div>
                                )}
                            </div>
                            <Input
                                id="cover"
                                type="file"
                                accept="image/*"
                                onChange={handleFileChange}
                                className="cursor-pointer bg-background"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="submit" disabled={isLoading || !name.trim()}>
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Создать
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};