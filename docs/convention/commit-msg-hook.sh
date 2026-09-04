#!/bin/bash
# GeekStudio-Team Git Commit Message Validator Hook

commit_msg_file=$1
commit_msg=$(head -n 1 "$commit_msg_file")

# 1. 포맷 검사 정규식: {이모지} {타입}: {제목}
# 허용되는 이모지: ✨, 🚑, 🔨, 💅, 📦, 🔧, 📝, ✅, 🎉
# 허용되는 타입: feat, fix, refactor, style, package, chore, docs, test, init
pattern="^(✨|🚑|🔨|💅|📦|🔧|📝|✅|🎉) (feat|fix|refactor|style|package|chore|docs|test|init): .+"

if [[ ! "$commit_msg" =~ $pattern ]]; then
    echo "❌ [Commit Rejected] 커밋 메시지 컨벤션에 맞지 않습니다."
    echo "형식: {이모지} {타입}: {제목}"
    echo "예시: ✨ feat: 로그인 기능 추가"
    echo "자세한 규칙은 docs/convention/git-commit.md 를 참고하세요."
    exit 1
fi

# 2. 이모지와 타입 매칭 검사
emoji="${BASH_REMATCH[1]}"
type="${BASH_REMATCH[2]}"

valid=0
case "$emoji" in
    "✨") [ "$type" == "feat" ] && valid=1 ;;
    "🚑") [ "$type" == "fix" ] && valid=1 ;;
    "🔨") [ "$type" == "refactor" ] && valid=1 ;;
    "💅") [ "$type" == "style" ] && valid=1 ;;
    "📦") [ "$type" == "package" ] && valid=1 ;;
    "🔧") [ "$type" == "chore" ] && valid=1 ;;
    "📝") [ "$type" == "docs" ] && valid=1 ;;
    "✅") [ "$type" == "test" ] && valid=1 ;;
    "🎉") [ "$type" == "init" ] && valid=1 ;;
esac

if [ $valid -ne 1 ]; then
    echo "❌ [Commit Rejected] 이모지와 타입 매칭이 올바르지 않습니다."
    echo "올바른 매칭 목록:"
    echo "  ✨ feat      - 새로운 기능 추가"
    echo "  🚑 fix       - 버그 수정 (긴급/기능 오류)"
    echo "  🔨 refactor  - 코드 리팩토링"
    echo "  💅 style     - UI 스타일 수정 및 디자인 변경"
    echo "  📦 package   - 패키지(의존성) 추가, 수정, 삭제"
    echo "  🔧 chore     - 설정 변경, 단순한 수정, 기타 작업"
    echo "  📝 docs      - 문서 수정"
    echo "  ✅ test      - 테스트 추가 및 수정"
    echo "  🎉 init      - 프로젝트 시작 (Initial Commit)"
    exit 1
fi

exit 0
