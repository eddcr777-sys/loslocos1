import { useState, useEffect } from 'react';
import { api, Post } from '../services/api';
import { useAuth } from '../context/AuthContext';

export const useProfile = (userId?: string) => {
    const { user, profile: currentUserProfile, refreshProfile } = useAuth();

    const [viewProfile, setViewProfile] = useState<any>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState({ full_name: '', username: '', faculty: '', bio: '', avatar_url: '' });
    const [avatarFile, setAvatarFile] = useState<File | null>(null);

    const [userPosts, setUserPosts] = useState<Post[]>([]);
    const [loadingPosts, setLoadingPosts] = useState(true);

    const [isFollowing, setIsFollowing] = useState(false);
    const [followCounts, setFollowCounts] = useState({ followers: 0, following: 0 });
    const [loadingFollow, setLoadingFollow] = useState(false);

    const isOwnProfile = !userId || (user && userId === user.id);

    useEffect(() => {
        loadProfileData();
    }, [userId, currentUserProfile]);

    const loadProfileData = async () => {
        setLoadingPosts(true);

        let targetProfile = null;

        if (isOwnProfile) {
            targetProfile = currentUserProfile;
        } else if (userId) {
            const { data } = await api.getProfileById(userId);
            targetProfile = data;
        }

        if (targetProfile) {
            setViewProfile(targetProfile);
            setEditForm({
                full_name: targetProfile.full_name || '',
                username: targetProfile.username || '',
                faculty: targetProfile.faculty || '',
                bio: targetProfile.bio || '',
                avatar_url: targetProfile.avatar_url || ''
            });

            const { data: postsData } = await api.getUserPosts(targetProfile.id);
            if (postsData) setUserPosts(postsData as any);

            const counts = await api.getFollowCounts(targetProfile.id);
            setFollowCounts({ followers: counts.followers, following: counts.following });

            if (!isOwnProfile && user) {
                const status = await api.getFollowStatus(targetProfile.id, user.id);
                setIsFollowing(status.following);
            }
        }
        setLoadingPosts(false);
    };

    const handleFollowToggle = async () => {
        if (!user || !viewProfile) return;
        setLoadingFollow(true);

        if (isFollowing) {
            await api.unfollowUser(viewProfile.id, user.id);
            setIsFollowing(false);
            setFollowCounts(prev => ({ ...prev, followers: prev.followers - 1 }));
        } else {
            await api.followUser(viewProfile.id, user.id);
            setIsFollowing(true);
            setFollowCounts(prev => ({ ...prev, followers: prev.followers + 1 }));

            await api.createNotification({
                user_id: viewProfile.id,
                actor_id: user.id,
                type: 'follow'
            });
        }
        setLoadingFollow(false);
    };

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        let finalAvatarUrl = editForm.avatar_url;

        if (avatarFile) {
            const { data, error } = await api.uploadImage(avatarFile, 'avatars');
            if (error) {
                console.error("Avatar upload error:", error);
                alert('Error uploading avatar: ' + error.message);
                return;
            }
            finalAvatarUrl = data || '';
        }

        const { error } = await api.updateProfile(user.id, {
            ...editForm,
            avatar_url: finalAvatarUrl
        });

        if (error) {
            alert(error.message);
        } else {
            setIsEditing(false);
            setAvatarFile(null);
            refreshProfile();
        }
    };

    return {
        viewProfile,
        isEditing,
        setIsEditing,
        editForm,
        setEditForm,
        avatarFile,
        setAvatarFile,
        userPosts,
        loadingPosts,
        isFollowing,
        followCounts,
        loadingFollow,
        isOwnProfile,
        handleFollowToggle,
        handleUpdateProfile,
        loadProfileData
    };
};
