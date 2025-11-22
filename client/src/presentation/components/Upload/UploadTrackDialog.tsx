import { useState } from 'react';
import { Button } from '@/components/ui/button.tsx';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog.tsx';
import { Input } from '@/components/ui/input.tsx';
import { Label } from '@/components/ui/label.tsx';
import { Upload, Loader2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast.ts';

export const UploadTrackDialog = () => {
    const [open, setOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    // Form states
    const [title, setTitle] = useState('');
    const [artist, setArtist] = useState('');
    const [file, setFile] = useState<File | null>(null);
    const [cover, setCover] = useState<File | null>(null);

    const handleUpload = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title || !artist || !file) {
            toast({
                title: "Validation Error",
                description: "Please fill in title, artist, and select an audio file.",
                variant: "destructive"
            });
            return;
        }

        setIsLoading(true);

        // Simulate API call delay
        setTimeout(() => {
            setIsLoading(false);
            setOpen(false);

            // Reset form
            setTitle('');
            setArtist('');
            setFile(null);
            setCover(null);

            toast({
                title: "Success",
                description: `Track "${title}" uploaded successfully!`,
            });
        }, 1500);
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" className="w-full justify-start gap-2 h-10 px-4 font-normal">
                    <Upload className="h-4 w-4" />
                    Загрузить трек
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <form onSubmit={handleUpload}>
                    <DialogHeader>
                        <DialogTitle>Upload Track</DialogTitle>
                        <DialogDescription>
                            Add a new track to your personal library.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="title" className="text-right">
                                Title
                            </Label>
                            <Input
                                id="title"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="col-span-3"
                                placeholder="Song title"
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="artist" className="text-right">
                                Artist
                            </Label>
                            <Input
                                id="artist"
                                value={artist}
                                onChange={(e) => setArtist(e.target.value)}
                                className="col-span-3"
                                placeholder="Artist name"
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="audio-file" className="text-right">
                                Audio
                            </Label>
                            <Input
                                id="audio-file"
                                type="file"
                                accept="audio/*"
                                onChange={(e) => setFile(e.target.files ? e.target.files[0] : null)}
                                className="col-span-3 cursor-pointer"
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="cover-file" className="text-right">
                                Cover (Opt)
                            </Label>
                            <Input
                                id="cover-file"
                                type="file"
                                accept="image/*"
                                onChange={(e) => setCover(e.target.files ? e.target.files[0] : null)}
                                className="col-span-3 cursor-pointer"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Upload
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};