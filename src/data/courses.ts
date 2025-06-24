export interface Course {
  id: string;
  title: string;
  description: string;
  detailedDescription: string;
  price: number;
  originalPrice?: number;
  duration: string;
  students: number;
  rating: number;
  level: string;
  image: string;
  features: string[];
  curriculum: {
    title: string;
    lessons: {
      title: string;
      duration?: string;
      videoUrl?: string;
      type: 'video' | 'text' | 'quiz' | 'assignment';
      isPreview?: boolean;
    }[];
  }[];
  instructor: {
    name: string;
    bio: string;
    experience: string;
  };
}

export const courses: Course[] = [
  {
    id: '1',
    title: 'Complete PTE Academic Preparation Course',
    description: 'Master all four skills with comprehensive practice materials and expert guidance.',
    detailedDescription: 'This comprehensive PTE Academic course covers all four language skills: Speaking, Writing, Reading, and Listening. With over 100 practice questions, detailed explanations, and personalized feedback, you\'ll be fully prepared to achieve your target score.',
    price: 299,
    originalPrice: 399,
    duration: '12 weeks',
    students: 2847,
    rating: 4.8,
    level: 'All Levels',
    image: 'https://images.pexels.com/photos/5212345/pexels-photo-5212345.jpeg?auto=compress&cs=tinysrgb&w=500',
    features: [
      'Speaking Practice with AI Feedback',
      'Writing Templates & Samples',
      'Reading Strategies',
      'Listening Comprehension',
      'Mock Tests',
      'Score Prediction',
      'Personalized Study Plan',
      'Live Q&A Sessions'
    ],
    curriculum: [
      {
        title: 'Speaking Module',
        lessons: [
          {
            title: 'Introduction to PTE Speaking',
            duration: '15 min',
            videoUrl: 'https://www.udemy.com/course/your-course/learn/lecture/12345678',
            type: 'video',
            isPreview: true
          },
          {
            title: 'Read Aloud Techniques',
            duration: '25 min',
            videoUrl: 'https://www.udemy.com/course/your-course/learn/lecture/12345679',
            type: 'video'
          },
          {
            title: 'Repeat Sentence Strategies',
            duration: '20 min',
            videoUrl: 'https://www.udemy.com/course/your-course/learn/lecture/12345680',
            type: 'video'
          },
          {
            title: 'Describe Image Methods',
            duration: '30 min',
            videoUrl: 'https://www.udemy.com/course/your-course/learn/lecture/12345681',
            type: 'video'
          },
          {
            title: 'Speaking Practice Quiz',
            duration: '10 min',
            type: 'quiz'
          }
        ]
      },
      {
        title: 'Writing Module',
        lessons: [
          {
            title: 'Writing Module Overview',
            duration: '12 min',
            videoUrl: 'https://www.udemy.com/course/your-course/learn/lecture/12345682',
            type: 'video',
            isPreview: true
          },
          {
            title: 'Summarize Written Text',
            duration: '35 min',
            videoUrl: 'https://www.udemy.com/course/your-course/learn/lecture/12345683',
            type: 'video'
          },
          {
            title: 'Essay Writing Mastery',
            duration: '45 min',
            videoUrl: 'https://www.udemy.com/course/your-course/learn/lecture/12345684',
            type: 'video'
          },
          {
            title: 'Grammar & Vocabulary Enhancement',
            duration: '25 min',
            videoUrl: 'https://www.udemy.com/course/your-course/learn/lecture/12345685',
            type: 'video'
          },
          {
            title: 'Writing Assignment',
            duration: '30 min',
            type: 'assignment'
          }
        ]
      },
      {
        title: 'Reading Module',
        lessons: [
          {
            title: 'Reading Strategies Overview',
            duration: '18 min',
            videoUrl: 'https://www.udemy.com/course/your-course/learn/lecture/12345686',
            type: 'video',
            isPreview: true
          },
          {
            title: 'Multiple Choice Questions',
            duration: '28 min',
            videoUrl: 'https://www.udemy.com/course/your-course/learn/lecture/12345687',
            type: 'video'
          },
          {
            title: 'Re-order Paragraphs',
            duration: '22 min',
            videoUrl: 'https://www.udemy.com/course/your-course/learn/lecture/12345688',
            type: 'video'
          },
          {
            title: 'Fill in the Blanks Mastery',
            duration: '26 min',
            videoUrl: 'https://www.udemy.com/course/your-course/learn/lecture/12345689',
            type: 'video'
          }
        ]
      },
      {
        title: 'Listening Module',
        lessons: [
          {
            title: 'Listening Skills Foundation',
            duration: '20 min',
            videoUrl: 'https://www.udemy.com/course/your-course/learn/lecture/12345690',
            type: 'video',
            isPreview: true
          },
          {
            title: 'Summarize Spoken Text',
            duration: '32 min',
            videoUrl: 'https://www.udemy.com/course/your-course/learn/lecture/12345691',
            type: 'video'
          },
          {
            title: 'Multiple Choice Listening',
            duration: '24 min',
            videoUrl: 'https://www.udemy.com/course/your-course/learn/lecture/12345692',
            type: 'video'
          },
          {
            title: 'Advanced Listening Techniques',
            duration: '28 min',
            videoUrl: 'https://www.udemy.com/course/your-course/learn/lecture/12345693',
            type: 'video'
          }
        ]
      }
    ],
    instructor: {
      name: 'Sarah Johnson',
      bio: 'Certified PTE trainer with 8+ years of experience helping students achieve their dream scores.',
      experience: '8 years'
    }
  },
  {
    id: '2',
    title: 'PTE Speaking Mastery',
    description: 'Perfect your speaking skills with advanced techniques and unlimited practice.',
    detailedDescription: 'Focus exclusively on the PTE Speaking section with intensive practice sessions, pronunciation training, and fluency development exercises designed to boost your speaking score significantly.',
    price: 149,
    originalPrice: 199,
    duration: '6 weeks',
    students: 1523,
    rating: 4.9,
    level: 'Intermediate',
    image: 'https://images.pexels.com/photos/3184418/pexels-photo-3184418.jpeg?auto=compress&cs=tinysrgb&w=500',
    features: [
      'Pronunciation Training',
      'Fluency Exercises',
      'Voice Recording Analysis',
      'Real-time Feedback',
      'Speaking Templates',
      'Confidence Building'
    ],
    curriculum: [
      {
        title: 'Foundation Skills',
        lessons: [
          {
            title: 'Pronunciation Fundamentals',
            duration: '22 min',
            videoUrl: 'https://www.udemy.com/course/speaking-course/learn/lecture/11111111',
            type: 'video',
            isPreview: true
          },
          {
            title: 'Intonation Patterns',
            duration: '18 min',
            videoUrl: 'https://www.udemy.com/course/speaking-course/learn/lecture/11111112',
            type: 'video'
          },
          {
            title: 'Stress and Rhythm',
            duration: '25 min',
            videoUrl: 'https://www.udemy.com/course/speaking-course/learn/lecture/11111113',
            type: 'video'
          },
          {
            title: 'Clarity Training',
            duration: '20 min',
            videoUrl: 'https://www.udemy.com/course/speaking-course/learn/lecture/11111114',
            type: 'video'
          }
        ]
      },
      {
        title: 'PTE Speaking Tasks',
        lessons: [
          {
            title: 'Read Aloud Mastery',
            duration: '30 min',
            videoUrl: 'https://www.udemy.com/course/speaking-course/learn/lecture/11111115',
            type: 'video'
          },
          {
            title: 'Repeat Sentence Excellence',
            duration: '25 min',
            videoUrl: 'https://www.udemy.com/course/speaking-course/learn/lecture/11111116',
            type: 'video'
          },
          {
            title: 'Describe Image Fluency',
            duration: '35 min',
            videoUrl: 'https://www.udemy.com/course/speaking-course/learn/lecture/11111117',
            type: 'video'
          },
          {
            title: 'Retell Lecture Confidence',
            duration: '28 min',
            videoUrl: 'https://www.udemy.com/course/speaking-course/learn/lecture/11111118',
            type: 'video'
          }
        ]
      }
    ],
    instructor: {
      name: 'Michael Chen',
      bio: 'Former IELTS examiner turned PTE specialist with expertise in accent reduction and fluency training.',
      experience: '6 years'
    }
  },
  {
    id: '3',
    title: 'PTE Writing Excellence',
    description: 'Develop superior writing skills with templates, techniques, and detailed feedback.',
    detailedDescription: 'Master the PTE Writing section with proven templates, advanced vocabulary, and comprehensive feedback on your essays and summaries to achieve a high writing score.',
    price: 129,
    duration: '4 weeks',
    students: 987,
    rating: 4.7,
    level: 'Advanced',
    image: 'https://images.pexels.com/photos/4144923/pexels-photo-4144923.jpeg?auto=compress&cs=tinysrgb&w=500',
    features: [
      'Essay Templates',
      'Summary Techniques',
      'Grammar Correction',
      'Vocabulary Enhancement',
      'Writing Feedback',
      'Time Management'
    ],
    curriculum: [
      {
        title: 'Writing Fundamentals',
        lessons: [
          {
            title: 'Essay Structure Basics',
            duration: '24 min',
            videoUrl: 'https://www.udemy.com/course/writing-course/learn/lecture/22222221',
            type: 'video',
            isPreview: true
          },
          {
            title: 'Paragraph Development',
            duration: '28 min',
            videoUrl: 'https://www.udemy.com/course/writing-course/learn/lecture/22222222',
            type: 'video'
          },
          {
            title: 'Coherence and Cohesion',
            duration: '32 min',
            videoUrl: 'https://www.udemy.com/course/writing-course/learn/lecture/22222223',
            type: 'video'
          },
          {
            title: 'Grammar Essentials',
            duration: '26 min',
            videoUrl: 'https://www.udemy.com/course/writing-course/learn/lecture/22222224',
            type: 'video'
          }
        ]
      },
      {
        title: 'PTE Writing Tasks',
        lessons: [
          {
            title: 'Summarize Written Text Mastery',
            duration: '35 min',
            videoUrl: 'https://www.udemy.com/course/writing-course/learn/lecture/22222225',
            type: 'video'
          },
          {
            title: 'Essay Writing Strategies',
            duration: '42 min',
            videoUrl: 'https://www.udemy.com/course/writing-course/learn/lecture/22222226',
            type: 'video'
          },
          {
            title: 'Advanced Vocabulary Usage',
            duration: '30 min',
            videoUrl: 'https://www.udemy.com/course/writing-course/learn/lecture/22222227',
            type: 'video'
          },
          {
            title: 'Proofreading Techniques',
            duration: '22 min',
            videoUrl: 'https://www.udemy.com/course/writing-course/learn/lecture/22222228',
            type: 'video'
          }
        ]
      }
    ],
    instructor: {
      name: 'Emma Wilson',
      bio: 'PhD in Applied Linguistics with specialization in academic writing and test preparation.',
      experience: '10 years'
    }
  },
  {
    id: '4',
    title: 'PTE Mock Test Series',
    description: 'Practice with full-length mock tests that simulate real PTE exam conditions.',
    detailedDescription: 'Take unlimited full-length PTE practice tests with detailed score analysis and improvement recommendations to track your progress and identify areas for improvement.',
    price: 79,
    originalPrice: 99,
    duration: 'Access for 3 months',
    students: 3421,
    rating: 4.6,
    level: 'All Levels',
    image: 'https://images.pexels.com/photos/5427644/pexels-photo-5427644.jpeg?auto=compress&cs=tinysrgb&w=500',
    features: [
      'Unlimited Mock Tests',
      'Real Exam Interface',
      'Detailed Score Reports',
      'Performance Analytics',
      'Question Bank Access',
      'Progress Tracking'
    ],
    curriculum: [
      {
        title: 'Test Practice',
        lessons: [
          {
            title: 'Mock Test Tutorial',
            duration: '15 min',
            videoUrl: 'https://www.udemy.com/course/mock-tests/learn/lecture/33333331',
            type: 'video',
            isPreview: true
          },
          {
            title: 'Full-Length Practice Test 1',
            duration: '180 min',
            type: 'quiz'
          },
          {
            title: 'Test 1 Review & Analysis',
            duration: '45 min',
            videoUrl: 'https://www.udemy.com/course/mock-tests/learn/lecture/33333332',
            type: 'video'
          },
          {
            title: 'Section-wise Practice Tests',
            duration: '120 min',
            type: 'quiz'
          }
        ]
      },
      {
        title: 'Improvement Strategies',
        lessons: [
          {
            title: 'Score Analysis Techniques',
            duration: '25 min',
            videoUrl: 'https://www.udemy.com/course/mock-tests/learn/lecture/33333333',
            type: 'video'
          },
          {
            title: 'Weakness Identification',
            duration: '20 min',
            videoUrl: 'https://www.udemy.com/course/mock-tests/learn/lecture/33333334',
            type: 'video'
          },
          {
            title: 'Targeted Practice Sessions',
            duration: '90 min',
            type: 'assignment'
          },
          {
            title: 'Test Day Preparation',
            duration: '18 min',
            videoUrl: 'https://www.udemy.com/course/mock-tests/learn/lecture/33333335',
            type: 'video'
          }
        ]
      }
    ],
    instructor: {
      name: 'David Kumar',
      bio: 'PTE test development consultant with insider knowledge of exam patterns and scoring.',
      experience: '5 years'
    }
  },
  {
    id: '5',
    title: 'PTE Reading & Listening Bootcamp',
    description: 'Intensive training for reading and listening sections with proven strategies.',
    detailedDescription: 'Accelerate your reading and listening skills with intensive training sessions, strategy development, and extensive practice materials designed for maximum score improvement.',
    price: 189,
    duration: '8 weeks',
    students: 1876,
    rating: 4.8,
    level: 'Intermediate',
    image: 'https://images.pexels.com/photos/4050321/pexels-photo-4050321.jpeg?auto=compress&cs=tinysrgb&w=500',
    features: [
      'Speed Reading Training',
      'Listening Strategies',
      'Question Type Mastery',
      'Time Management',
      'Practice Materials',
      'Strategy Workshops'
    ],
    curriculum: [
      {
        title: 'Reading Skills',
        lessons: [
          {
            title: 'Speed Reading Fundamentals',
            duration: '28 min',
            videoUrl: 'https://www.udemy.com/course/reading-listening/learn/lecture/44444441',
            type: 'video',
            isPreview: true
          },
          {
            title: 'Skimming and Scanning Techniques',
            duration: '32 min',
            videoUrl: 'https://www.udemy.com/course/reading-listening/learn/lecture/44444442',
            type: 'video'
          },
          {
            title: 'Multiple Choice Strategies',
            duration: '26 min',
            videoUrl: 'https://www.udemy.com/course/reading-listening/learn/lecture/44444443',
            type: 'video'
          },
          {
            title: 'Re-order Paragraphs Mastery',
            duration: '30 min',
            videoUrl: 'https://www.udemy.com/course/reading-listening/learn/lecture/44444444',
            type: 'video'
          }
        ]
      },
      {
        title: 'Listening Skills',
        lessons: [
          {
            title: 'Active Listening Techniques',
            duration: '24 min',
            videoUrl: 'https://www.udemy.com/course/reading-listening/learn/lecture/44444445',
            type: 'video'
          },
          {
            title: 'Note-taking Strategies',
            duration: '22 min',
            videoUrl: 'https://www.udemy.com/course/reading-listening/learn/lecture/44444446',
            type: 'video'
          },
          {
            title: 'Accent Recognition Training',
            duration: '35 min',
            videoUrl: 'https://www.udemy.com/course/reading-listening/learn/lecture/44444447',
            type: 'video'
          },
          {
            title: 'Prediction and Context Clues',
            duration: '28 min',
            videoUrl: 'https://www.udemy.com/course/reading-listening/learn/lecture/44444448',
            type: 'video'
          }
        ]
      }
    ],
    instructor: {
      name: 'Lisa Park',
      bio: 'Cognitive psychologist specializing in language acquisition and test-taking strategies.',
      experience: '7 years'
    }
  },
  {
    id: '6',
    title: 'PTE Score Guarantee Program',
    description: 'Comprehensive program with score guarantee - achieve your target or get your money back.',
    detailedDescription: 'Our most comprehensive PTE preparation program with a score guarantee. If you don\'t achieve your target score after completing the program, get a full refund. Includes all materials, one-on-one coaching, and unlimited practice.',
    price: 599,
    originalPrice: 799,
    duration: '16 weeks',
    students: 892,
    rating: 4.9,
    level: 'All Levels',
    image: 'https://images.pexels.com/photos/3184460/pexels-photo-3184460.jpeg?auto=compress&cs=tinysrgb&w=500',
    features: [
      'Score Guarantee',
      'One-on-One Coaching',
      'All Course Materials',
      'Unlimited Practice',
      'Priority Support',
      'Study Plan Customization',
      'Regular Assessments',
      'Money-back Guarantee'
    ],
    curriculum: [
      {
        title: 'Complete Foundation',
        lessons: [
          {
            title: 'Program Overview & Goal Setting',
            duration: '30 min',
            videoUrl: 'https://www.udemy.com/course/guarantee-program/learn/lecture/55555551',
            type: 'video',
            isPreview: true
          },
          {
            title: 'Diagnostic Assessment',
            duration: '120 min',
            type: 'quiz'
          },
          {
            title: 'Personalized Study Plan Creation',
            duration: '45 min',
            videoUrl: 'https://www.udemy.com/course/guarantee-program/learn/lecture/55555552',
            type: 'video'
          },
          {
            title: 'All Four Skills Comprehensive Training',
            duration: '240 min',
            videoUrl: 'https://www.udemy.com/course/guarantee-program/learn/lecture/55555553',
            type: 'video'
          }
        ]
      },
      {
        title: 'Advanced Preparation',
        lessons: [
          {
            title: 'Intensive Practice Sessions',
            duration: '180 min',
            type: 'assignment'
          },
          {
            title: 'Weekly Mock Test Series',
            duration: '180 min',
            type: 'quiz'
          },
          {
            title: 'One-on-One Coaching Sessions',
            duration: '60 min',
            type: 'video'
          },
          {
            title: 'Final Preparation & Test Strategy',
            duration: '90 min',
            videoUrl: 'https://www.udemy.com/course/guarantee-program/learn/lecture/55555554',
            type: 'video'
          }
        ]
      }
    ],
    instructor: {
      name: 'Team of Expert Instructors',
      bio: 'A dedicated team of certified PTE trainers with combined experience of over 50 years.',
      experience: '50+ years combined'
    }
  }
];