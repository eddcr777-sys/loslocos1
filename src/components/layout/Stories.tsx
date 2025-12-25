import React, { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import Avatar from '../ui/Avatar';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import StoryViewer from '../stories/StoryViewer';
import CreateStoryModal from '../stories/CreateStoryModal';
import './Stories.css';

const DEFAULT_AVATAR = 'https://cdn-icons-png.flaticon.com/512/149/149071.png';

const getFacultyColor = (faculty?: string) => {
  const f = faculty?.toLowerCase() || '';
  if (f.includes('ing') || f.includes('eng')) return 'var(--faculty-eng)';
  if (f.includes('med') || f.includes('salud')) return 'var(--faculty-med)';
  if (f.includes('der') || f.includes('law')) return 'var(--faculty-law)';
  if (f.includes('art')) return 'var(--faculty-art)';
  if (f.includes('neg') || f.includes('bus')) return 'var(--faculty-bus)';
  if (f.includes('cie') || f.includes('sci')) return 'var(--faculty-sci)';
  if (f.includes('hum')) return 'var(--faculty-hum)';
  return 'var(--faculty-eng)'; // Default brand color
};

const Stories: React.FC = () => {
  const { profile, user } = useAuth();
  const [storiesGroups, setStoriesGroups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showViewer, setShowViewer] = useState(false);
  const [showCreator, setShowCreator] = useState(false);
  const [activeGroupIndex, setActiveGroupIndex] = useState(0);

  const fetchStories = async () => {
    setLoading(true);
    const { data } = await api.getStories();
    if (data) {
      // Agrupar por user_id
      const groups = data.reduce((acc: any[], story: any) => {
        const existingGroup = acc.find(g => g.user_id === story.user_id);
        if (existingGroup) {
          existingGroup.stories.push(story);
        } else {
          acc.push({
            user_id: story.user_id,
            profiles: story.profiles,
            stories: [story]
          });
        }
        return acc;
      }, []);

      // Mover el grupo del usuario actual al principio (o simplemente detectarlo)
      const sortedGroups = groups.sort((a, b) => {
        if (a.user_id === user?.id) return -1;
        if (b.user_id === user?.id) return 1;
        return 0;
      });

      setStoriesGroups(sortedGroups);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchStories();
  }, [user]);

  const handleOpenViewer = (index: number) => {
    setActiveGroupIndex(index);
    setShowViewer(true);
  };

  const currentUserGroup = storiesGroups.find(g => g.user_id === user?.id);
  const otherGroups = storiesGroups.filter(g => g.user_id !== user?.id);

  return (
    <div className="stories-container">
      <div className="stories-scroll">
        {/* Tu Historia / Grupo del usuario */}
        <div 
          className="story-item" 
          onClick={() => currentUserGroup ? handleOpenViewer(storiesGroups.indexOf(currentUserGroup)) : setShowCreator(true)}
        >
          <div 
            className={`story-avatar-wrapper ${currentUserGroup ? 'unviewed' : 'viewed'}`}
            style={currentUserGroup ? { background: getFacultyColor(profile?.faculty), boxShadow: `0 0 10px ${getFacultyColor(profile?.faculty)}44` } : {}}
          >
             <Avatar src={profile?.avatar_url || DEFAULT_AVATAR} size="large" className="story-avatar" />
             <div className="minimal-add-badge" onClick={(e) => { e.stopPropagation(); setShowCreator(true); }}>
                <Plus size={14} />
             </div>
          </div>
          <span className="story-username">Tu historia</span>
        </div>

        {/* Historias de otros */}
        {loading ? (
          <div className="story-skeleton" />
        ) : (
          otherGroups.map((group) => (
            <div 
              key={group.user_id} 
              className="story-item" 
              onClick={() => handleOpenViewer(storiesGroups.indexOf(group))}
            >
              <div 
                className="story-avatar-wrapper unviewed"
                style={{ background: getFacultyColor(group.profiles.faculty), boxShadow: `0 0 10px ${getFacultyColor(group.profiles.faculty)}44` }}
              >
                 <Avatar src={group.profiles.avatar_url || DEFAULT_AVATAR} size="large" className="story-avatar" />
              </div>
              <span className="story-username">{group.profiles.full_name.split(' ')[0]}</span>
            </div>
          ))
        )}
      </div>

      {showViewer && storiesGroups.length > 0 && (
        <StoryViewer 
          stories={storiesGroups[activeGroupIndex].stories} 
          initialIndex={0} 
          onClose={() => setShowViewer(false)}
          onStoryDeleted={fetchStories}
          onAddStory={() => {
            setShowViewer(false);
            setShowCreator(true);
          }}
        />
      )}

      {showCreator && (
        <CreateStoryModal 
          onClose={() => setShowCreator(false)} 
          onStoryCreated={fetchStories} 
        />
      )}
    </div>
  );
};

export default Stories;
